# keel_api/src/modules/connectors/focus/service.py

"""Focus connector tool execution adapters."""

from __future__ import annotations

import time
from secrets import token_urlsafe
from typing import Any, Awaitable, Callable

from pydantic import BaseModel, ValidationError

from pathlib import Path

from core.errors import AppError
from modules.connectors import config as connector_config
from modules.connectors.auth import (
    ConnectorSession,
    create_connector_session,
    get_active_session_for_user,
    get_idempotent_response,
    require_scope,
    revoke_connector_session_for_user,
    store_idempotent_response,
)
from modules.connectors.focus import config as focus_config
from modules.connectors.focus import events as focus_events
from modules.connectors.focus.manifest import (
    FOCUS_CONNECTOR_TOOL_NAMES,
    build_focus_manifest,
    get_tool_definition,
)
from modules.connectors.schemas import (
    ConnectorSessionCreate,
    ConnectorSessionCreated,
    ConnectorSessionPublic,
    ConnectorToolInvokeRequest,
    ConnectorToolInvokeResponse,
)
from modules.connectors.service import to_session_public
from modules.focus import service as focus_service
from modules.focus.schemas import (
    FocusNodeCreate,
    FocusNodeReorder,
    FocusNodeReorderEntry,
    FocusNodeUpdate,
    FocusTagCreate,
    FocusTagUpdate,
)


ToolHandler = Callable[[int, dict[str, Any], bool], Awaitable[dict[str, Any]]]



# ----- Session helpers
def _normalize_scopes(scopes: list[str] | None) -> frozenset[str]:
    if scopes is None:
        return connector_config.DEFAULT_FOCUS_SCOPES
    allowed = connector_config.DEFAULT_FOCUS_SCOPES
    normalized = {scope.strip() for scope in scopes if scope.strip()}
    invalid = normalized - allowed
    if invalid:
        raise AppError(f"Unsupported connector scopes: {', '.join(sorted(invalid))}.", status_code=400)
    if not normalized:
        raise AppError("At least one connector scope is required.", status_code=400)
    return frozenset(normalized)


async def create_focus_connector_session(
    user_id: int,
    payload: ConnectorSessionCreate,
) -> ConnectorSessionCreated:
    raw_token, session = create_connector_session(
        user_id=user_id,
        connector=focus_config.CONNECTOR_KEY,
        actor_label=payload.actor_label,
        scopes=_normalize_scopes(payload.scopes),
    )
    focus_events.publish_session_enabled(session)
    public = to_session_public(session)
    return ConnectorSessionCreated(**public.model_dump(), token=raw_token)


def get_focus_connector_session(user_id: int) -> ConnectorSessionPublic | None:
    session = get_active_session_for_user(user_id=user_id, connector=focus_config.CONNECTOR_KEY)
    if session is None:
        return None
    return to_session_public(session)


async def revoke_focus_connector_session(user_id: int) -> ConnectorSessionPublic | None:
    session = revoke_connector_session_for_user(
        user_id=user_id,
        connector=focus_config.CONNECTOR_KEY,
    )
    if session is None:
        return None
    focus_events.publish_session_disabled(session)
    return to_session_public(session)


def get_focus_manifest() -> dict[str, Any]:
    return build_focus_manifest()


_FOCUS_GUIDE_PATH = (
    Path(__file__).resolve().parents[4] / "docs" / "connectors" / "focus-ai-connector.md"
)


def get_focus_connector_guide() -> dict[str, str]:
    if not _FOCUS_GUIDE_PATH.is_file():
        raise AppError("Focus connector guide is not available.", status_code=500)
    return {
        "format": "markdown",
        "content": _FOCUS_GUIDE_PATH.read_text(encoding="utf-8"),
    }



# ----- Serialization helpers
def _model_to_dict(model: BaseModel) -> dict[str, Any]:
    return model.model_dump(mode="json")


def _models_to_list(models: list[BaseModel]) -> list[dict[str, Any]]:
    return [_model_to_dict(model) for model in models]


def _extract_node_ids(arguments: dict[str, Any]) -> list[int]:
    node_ids: list[int] = []
    for key in ("node_id", "parent_id", "list_id"):
        value = arguments.get(key)
        if isinstance(value, int) and value > 0:
            node_ids.append(value)
    raw_node_ids = arguments.get("node_ids")
    if isinstance(raw_node_ids, list):
        for value in raw_node_ids:
            if isinstance(value, int) and value > 0:
                node_ids.append(value)
    entries = arguments.get("entries")
    if isinstance(entries, list):
        for entry in entries:
            if isinstance(entry, dict):
                entry_id = entry.get("id")
                if isinstance(entry_id, int) and entry_id > 0:
                    node_ids.append(entry_id)
    return sorted(set(node_ids))


def _arguments_summary(tool_name: str, arguments: dict[str, Any]) -> str:
    if not arguments:
        return f"Invoke {tool_name}"
    parts = [f"{key}={value}" for key, value in arguments.items()]
    summary = ", ".join(parts)
    if len(summary) > 240:
        return summary[:237] + "..."
    return summary


def _result_summary(tool_name: str, result: dict[str, Any]) -> str:
    if "node" in result and isinstance(result["node"], dict):
        node_id = result["node"].get("id")
        return f"{tool_name} completed for node {node_id}"
    if "nodes" in result and "edges" in result and "expanded_ids" in result:
        return (
            f"Returned constellation layout with {len(result['nodes'])} node(s) "
            f"and {len(result['edges'])} edge(s)"
        )
    if "nodes" in result and isinstance(result["nodes"], list):
        return f"{tool_name} returned {len(result['nodes'])} node(s)"
    if "tags" in result and isinstance(result["tags"], list):
        return f"{tool_name} returned {len(result['tags'])} tag(s)"
    if "references" in result and isinstance(result["references"], list):
        return f"{tool_name} returned {len(result['references'])} reference(s)"
    if "highlighted_node_ids" in result and isinstance(result["highlighted_node_ids"], list):
        return f"Highlighted {len(result['highlighted_node_ids'])} node(s)"
    if "expanded" in result and isinstance(result.get("node_id"), int):
        state = "expanded" if result["expanded"] else "collapsed"
        return f"Node {result['node_id']} {state}"
    if "position_key" in result and isinstance(result.get("node_id"), int):
        return f"Placed node {result['node_id']} on constellation canvas"
    if result.get("aligned") is True and isinstance(result.get("parent_id"), int):
        return f"Aligned children around node {result['parent_id']}"
    if result.get("deleted") is True:
        return f"{tool_name} deleted node {result.get('node_id')}"
    return f"{tool_name} completed"


def _changed_node_ids(tool_name: str, arguments: dict[str, Any], result: dict[str, Any]) -> list[int]:
    if tool_name == "delete_focus_node":
        node_id = arguments.get("node_id")
        return [node_id] if isinstance(node_id, int) else []
    if "node" in result and isinstance(result["node"], dict):
        node_id = result["node"].get("id")
        return [node_id] if isinstance(node_id, int) else []
    if "nodes" in result and isinstance(result["nodes"], list):
        ids = [
            node["id"]
            for node in result["nodes"]
            if isinstance(node, dict) and isinstance(node.get("id"), int)
        ]
        return ids
    return _extract_node_ids(arguments)


def _should_refetch_focus(tool_name: str, tool_def: dict[str, Any]) -> bool:
    if tool_def.get("mutates"):
        return True
    return tool_name in {"list_focus_nodes", "get_focus_node"}



# ----- Tool handlers
async def _handle_list_focus_nodes(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    nodes = await focus_service.list_focus_nodes(
        user_id,
        parent_id=arguments.get("parent_id"),
        roots_only=bool(arguments.get("roots_only", False)),
        kind=arguments.get("kind"),
        kinds=arguments.get("kinds"),
        status=arguments.get("status"),
        hub_lists_only=bool(arguments.get("hub_lists_only", False)),
    )
    return {"nodes": _models_to_list(nodes)}


async def _handle_get_focus_node(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    node_id = arguments["node_id"]
    node = await focus_service.get_focus_node(
        user_id,
        node_id,
        include_subtree=bool(arguments.get("include_subtree", False)),
    )
    return {"node": _model_to_dict(node)}


async def _handle_create_focus_node(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    payload = FocusNodeCreate.model_validate(arguments)
    if dry_run:
        return {"dry_run": True, "would_create": _model_to_dict(payload)}
    node = await focus_service.create_focus_node(user_id, payload)
    return {"node": _model_to_dict(node)}


async def _handle_update_focus_node(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    node_id = arguments.pop("node_id")
    payload = FocusNodeUpdate.model_validate(arguments)
    if dry_run:
        return {"dry_run": True, "node_id": node_id, "would_update": _model_to_dict(payload)}
    node = await focus_service.update_focus_node(user_id, node_id, payload)
    return {"node": _model_to_dict(node)}


async def _handle_delete_focus_node(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    node_id = arguments["node_id"]
    if dry_run:
        return {"dry_run": True, "would_delete_node_id": node_id}
    await focus_service.delete_focus_node(user_id, node_id)
    return {"deleted": True, "node_id": node_id}


async def _handle_complete_focus_node(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    node_id = arguments["node_id"]
    if dry_run:
        return {"dry_run": True, "would_complete_node_id": node_id}
    node = await focus_service.complete_focus_node(user_id, node_id)
    return {"node": _model_to_dict(node)}


async def _handle_reorder_focus_nodes(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    entries = [
        FocusNodeReorderEntry.model_validate(entry) for entry in arguments["entries"]
    ]
    payload = FocusNodeReorder(entries=entries)
    if dry_run:
        return {"dry_run": True, "would_reorder": _model_to_dict(payload)}
    nodes = await focus_service.reorder_focus_nodes(user_id, payload)
    return {"nodes": _models_to_list(nodes)}


async def _handle_list_focus_tags(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    tags = await focus_service.list_focus_tags(user_id)
    return {"tags": _models_to_list(tags)}


async def _handle_create_focus_tag(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    payload = FocusTagCreate.model_validate(arguments)
    if dry_run:
        return {"dry_run": True, "would_create": _model_to_dict(payload)}
    tag = await focus_service.create_focus_tag(user_id, payload)
    return {"tag": _model_to_dict(tag)}


async def _handle_update_focus_tag(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    tag_id = arguments.pop("tag_id")
    payload = FocusTagUpdate.model_validate(arguments)
    if dry_run:
        return {"dry_run": True, "tag_id": tag_id, "would_update": _model_to_dict(payload)}
    tag = await focus_service.update_focus_tag(user_id, tag_id, payload)
    return {"tag": _model_to_dict(tag)}


async def _handle_delete_focus_tag(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    tag_id = arguments["tag_id"]
    if dry_run:
        return {"dry_run": True, "would_delete_tag_id": tag_id}
    await focus_service.delete_focus_tag(user_id, tag_id)
    return {"deleted": True, "tag_id": tag_id}


async def _handle_search_focus_references(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    references = await focus_service.search_references(
        user_id,
        target_type=arguments["type"],
        query=arguments.get("q", ""),
    )
    return {"references": _models_to_list(references)}


async def _handle_get_focus_reference_detail(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    detail = await focus_service.get_reference_detail(
        user_id,
        target_type=arguments["type"],
        target_id=arguments["id"],
    )
    return {"reference": _model_to_dict(detail)}


async def _handle_highlight_focus_nodes(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    raw_ids = arguments.get("node_ids")
    if not isinstance(raw_ids, list) or not raw_ids:
        raise AppError("node_ids must be a non-empty array.", status_code=400)
    node_ids = sorted({value for value in raw_ids if isinstance(value, int) and value > 0})
    if not node_ids:
        raise AppError("node_ids must contain at least one valid node id.", status_code=400)
    if dry_run:
        return {"dry_run": True, "highlighted_node_ids": node_ids}
    for node_id in node_ids:
        await focus_service.get_focus_node(user_id, node_id, include_subtree=False)
    return {"highlighted_node_ids": node_ids}


async def _handle_set_focus_constellation_node_expanded(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    node_id = arguments["node_id"]
    expanded = bool(arguments["expanded"])
    if dry_run:
        return {"dry_run": True, "node_id": node_id, "expanded": expanded}
    await focus_service.get_focus_node(user_id, node_id, include_subtree=False)
    return {"node_id": node_id, "expanded": expanded}


async def _handle_get_focus_constellation_layout(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    if dry_run:
        return {"dry_run": True}
    return await focus_service.build_constellation_layout_snapshot(user_id)


async def _handle_align_focus_constellation_children(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    parent_id = arguments["parent_id"]
    if dry_run:
        return {"dry_run": True, "parent_id": parent_id}
    parent = await focus_service.get_focus_node(user_id, parent_id, include_subtree=False)
    if parent.child_count < 1:
        raise AppError("Parent node has no children to align.", status_code=400)
    return {"aligned": True, "parent_id": parent_id}


async def _handle_place_focus_constellation_node(
    user_id: int,
    arguments: dict[str, Any],
    dry_run: bool,
) -> dict[str, Any]:
    node_id = arguments["node_id"]
    placement = arguments.get("placement")
    if not isinstance(placement, dict):
        raise AppError("placement must be an object.", status_code=400)
    if dry_run:
        return {"dry_run": True, "node_id": node_id, "would_place": placement}
    return await focus_service.place_focus_constellation_node(
        user_id,
        node_id=node_id,
        placement=placement,
    )


TOOL_HANDLERS: dict[str, ToolHandler] = {
    "list_focus_nodes": _handle_list_focus_nodes,
    "get_focus_node": _handle_get_focus_node,
    "create_focus_node": _handle_create_focus_node,
    "update_focus_node": _handle_update_focus_node,
    "delete_focus_node": _handle_delete_focus_node,
    "complete_focus_node": _handle_complete_focus_node,
    "reorder_focus_nodes": _handle_reorder_focus_nodes,
    "list_focus_tags": _handle_list_focus_tags,
    "create_focus_tag": _handle_create_focus_tag,
    "update_focus_tag": _handle_update_focus_tag,
    "delete_focus_tag": _handle_delete_focus_tag,
    "search_focus_references": _handle_search_focus_references,
    "get_focus_reference_detail": _handle_get_focus_reference_detail,
    "highlight_focus_nodes": _handle_highlight_focus_nodes,
    "set_focus_constellation_node_expanded": _handle_set_focus_constellation_node_expanded,
    "get_focus_constellation_layout": _handle_get_focus_constellation_layout,
    "align_focus_constellation_children": _handle_align_focus_constellation_children,
    "place_focus_constellation_node": _handle_place_focus_constellation_node,
}



# ----- Invocation
async def invoke_focus_tool(
    session: ConnectorSession,
    tool_name: str,
    payload: ConnectorToolInvokeRequest,
) -> ConnectorToolInvokeResponse:
    if tool_name not in FOCUS_CONNECTOR_TOOL_NAMES:
        raise AppError(f"Unknown connector tool: {tool_name}.", status_code=404)

    tool_def = get_tool_definition(tool_name)
    if tool_def is None:
        raise AppError(f"Unknown connector tool: {tool_name}.", status_code=404)

    cached = get_idempotent_response(
        token_hash=session.token_hash,
        idempotency_key=payload.idempotency_key,
    )
    if cached is not None:
        return ConnectorToolInvokeResponse.model_validate(cached)

    require_scope(session, tool_def["scope"])
    handler = TOOL_HANDLERS[tool_name]
    call_id = token_urlsafe(12)
    started = time.perf_counter()
    node_ids = _extract_node_ids(payload.arguments)
    focus_events.publish_tool_started(
        session=session,
        call_id=call_id,
        tool_name=tool_name,
        arguments_summary=_arguments_summary(tool_name, payload.arguments),
        node_ids=node_ids,
    )

    try:
        result = await handler(session.user_id, dict(payload.arguments), payload.dry_run)
    except ValidationError as exc:
        duration_ms = int((time.perf_counter() - started) * 1000)
        focus_events.publish_tool_failed(
            session=session,
            call_id=call_id,
            tool_name=tool_name,
            duration_ms=duration_ms,
            message="Invalid tool arguments.",
            error_code="validation_error",
        )
        raise AppError("Invalid tool arguments.", status_code=400) from exc
    except AppError as exc:
        duration_ms = int((time.perf_counter() - started) * 1000)
        focus_events.publish_tool_failed(
            session=session,
            call_id=call_id,
            tool_name=tool_name,
            duration_ms=duration_ms,
            message=exc.message,
            error_code="app_error",
        )
        raise
    except Exception as exc:
        duration_ms = int((time.perf_counter() - started) * 1000)
        focus_events.publish_tool_failed(
            session=session,
            call_id=call_id,
            tool_name=tool_name,
            duration_ms=duration_ms,
            message="Connector tool execution failed.",
            error_code="internal_error",
        )
        raise AppError("Connector tool execution failed.", status_code=500) from exc

    duration_ms = int((time.perf_counter() - started) * 1000)
    changed_node_ids = _changed_node_ids(tool_name, payload.arguments, result)
    should_refetch = _should_refetch_focus(tool_name, tool_def)

    if tool_name == "get_focus_node" and isinstance(payload.arguments.get("node_id"), int):
        focus_events.publish_node_viewed(
            session=session,
            call_id=call_id,
            node_id=payload.arguments["node_id"],
        )

    if tool_name == "highlight_focus_nodes":
        highlighted = result.get("highlighted_node_ids")
        if isinstance(highlighted, list):
            node_ids = [value for value in highlighted if isinstance(value, int) and value > 0]
            if node_ids:
                focus_events.publish_nodes_highlighted(
                    session=session,
                    call_id=call_id,
                    node_ids=node_ids,
                )

    if tool_name == "set_focus_constellation_node_expanded":
        node_id = result.get("node_id")
        expanded = result.get("expanded")
        if isinstance(node_id, int) and isinstance(expanded, bool):
            focus_events.publish_node_expansion_changed(
                session=session,
                call_id=call_id,
                node_id=node_id,
                expanded=expanded,
            )

    if tool_name == "align_focus_constellation_children":
        parent_id = result.get("parent_id")
        if isinstance(parent_id, int) and result.get("aligned") is True:
            focus_events.publish_children_aligned(
                session=session,
                call_id=call_id,
                parent_id=parent_id,
            )

    if tool_name == "place_focus_constellation_node":
        node_id = result.get("node_id")
        position_key = result.get("position_key")
        x = result.get("x")
        y = result.get("y")
        if (
            isinstance(node_id, int)
            and isinstance(position_key, str)
            and isinstance(x, (int, float))
            and isinstance(y, (int, float))
        ):
            focus_events.publish_constellation_positions_changed(
                session=session,
                call_id=call_id,
                node_id=node_id,
                positions=[{"key": position_key, "x": float(x), "y": float(y)}],
            )

    focus_events.publish_tool_completed(
        session=session,
        call_id=call_id,
        tool_name=tool_name,
        duration_ms=duration_ms,
        result_summary=_result_summary(tool_name, result),
        changed_node_ids=changed_node_ids,
        should_refetch_focus=should_refetch,
    )

    response = ConnectorToolInvokeResponse(
        tool_name=tool_name,
        call_id=call_id,
        duration_ms=duration_ms,
        dry_run=payload.dry_run,
        result=result,
        changed_node_ids=changed_node_ids,
        should_refetch_focus=should_refetch,
    )
    store_idempotent_response(
        token_hash=session.token_hash,
        idempotency_key=payload.idempotency_key,
        response=response.model_dump(mode="json"),
    )
    return response
