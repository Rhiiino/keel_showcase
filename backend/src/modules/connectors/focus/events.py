# keel_api/src/modules/connectors/focus/events.py

"""Focus automation event builders."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from modules.connectors.auth import ConnectorSession
from modules.connectors.focus import config as focus_config
from modules.connectors.realtime import build_actor, publish_connector_event
from modules.connectors.schemas import ConnectorAutomationEventPublic


def _actor(session: ConnectorSession) -> Any:
    return build_actor(actor_label=session.actor_label)


def publish_session_enabled(session: ConnectorSession) -> None:
    publish_connector_event(
        user_id=session.user_id,
        connector=focus_config.CONNECTOR_KEY,
        event=ConnectorAutomationEventPublic(
            event="focus.automation.session.enabled",
            actor=_actor(session),
            session_id=session.session_id,
        ),
    )


def publish_session_disabled(session: ConnectorSession) -> None:
    publish_connector_event(
        user_id=session.user_id,
        connector=focus_config.CONNECTOR_KEY,
        event=ConnectorAutomationEventPublic(
            event="focus.automation.session.disabled",
            actor=_actor(session),
            session_id=session.session_id,
        ),
    )


def publish_tool_started(
    *,
    session: ConnectorSession,
    call_id: str,
    tool_name: str,
    arguments_summary: str,
    node_ids: list[int] | None = None,
) -> None:
    node_ids = node_ids or []
    # Expand/collapse is applied via the expansion_changed event, not a camera pan;
    # panning here would only flash a highlight without unfolding the node.
    pan_to_node_id = None
    if tool_name != "set_focus_constellation_node_expanded":
        pan_to_node_id = node_ids[0] if node_ids else None
    publish_connector_event(
        user_id=session.user_id,
        connector=focus_config.CONNECTOR_KEY,
        event=ConnectorAutomationEventPublic(
            event="focus.tool_call.started",
            actor=_actor(session),
            call_id=call_id,
            tool_name=tool_name,
            started_at=datetime.now(UTC),
            arguments_summary=arguments_summary,
            node_ids=node_ids,
            pan_to_node_id=pan_to_node_id,
        ),
    )


def publish_tool_completed(
    *,
    session: ConnectorSession,
    call_id: str,
    tool_name: str,
    duration_ms: int,
    result_summary: str,
    changed_node_ids: list[int] | None = None,
    should_refetch_focus: bool = False,
) -> None:
    changed = changed_node_ids or []
    pan_to_node_id = None
    if tool_name != "set_focus_constellation_node_expanded":
        pan_to_node_id = changed[0] if changed else None
    publish_connector_event(
        user_id=session.user_id,
        connector=focus_config.CONNECTOR_KEY,
        event=ConnectorAutomationEventPublic(
            event="focus.tool_call.completed",
            actor=_actor(session),
            call_id=call_id,
            tool_name=tool_name,
            duration_ms=duration_ms,
            result_summary=result_summary,
            changed_node_ids=changed,
            node_ids=changed,
            pan_to_node_id=pan_to_node_id,
            should_refetch_focus=should_refetch_focus,
        ),
    )


def publish_tool_failed(
    *,
    session: ConnectorSession,
    call_id: str,
    tool_name: str,
    duration_ms: int,
    message: str,
    error_code: str = "tool_failed",
) -> None:
    publish_connector_event(
        user_id=session.user_id,
        connector=focus_config.CONNECTOR_KEY,
        event=ConnectorAutomationEventPublic(
            event="focus.tool_call.failed",
            actor=_actor(session),
            call_id=call_id,
            tool_name=tool_name,
            duration_ms=duration_ms,
            message=message,
            error_code=error_code,
        ),
    )


def publish_nodes_highlighted(
    *,
    session: ConnectorSession,
    call_id: str,
    node_ids: list[int],
) -> None:
    publish_connector_event(
        user_id=session.user_id,
        connector=focus_config.CONNECTOR_KEY,
        event=ConnectorAutomationEventPublic(
            event="focus.nodes.highlighted",
            actor=_actor(session),
            call_id=call_id,
            node_ids=node_ids,
            highlighted_node_ids=node_ids,
        ),
    )


def publish_node_expansion_changed(
    *,
    session: ConnectorSession,
    call_id: str,
    node_id: int,
    expanded: bool,
) -> None:
    publish_connector_event(
        user_id=session.user_id,
        connector=focus_config.CONNECTOR_KEY,
        event=ConnectorAutomationEventPublic(
            event="focus.constellation.node.expansion_changed",
            actor=_actor(session),
            call_id=call_id,
            node_ids=[node_id],
            expanded=expanded,
            result_summary=f"{'Expanded' if expanded else 'Collapsed'} node {node_id}",
        ),
    )


def publish_children_aligned(
    *,
    session: ConnectorSession,
    call_id: str,
    parent_id: int,
) -> None:
    publish_connector_event(
        user_id=session.user_id,
        connector=focus_config.CONNECTOR_KEY,
        event=ConnectorAutomationEventPublic(
            event="focus.constellation.children_aligned",
            actor=_actor(session),
            call_id=call_id,
            node_ids=[parent_id],
            result_summary=f"Aligned children around node {parent_id}",
        ),
    )


def publish_constellation_positions_changed(
    *,
    session: ConnectorSession,
    call_id: str,
    node_id: int,
    positions: list[dict[str, float | str]],
) -> None:
    publish_connector_event(
        user_id=session.user_id,
        connector=focus_config.CONNECTOR_KEY,
        event=ConnectorAutomationEventPublic(
            event="focus.constellation.positions_changed",
            actor=_actor(session),
            call_id=call_id,
            node_ids=[node_id],
            constellation_positions=positions,
            result_summary=f"Moved constellation node {node_id}",
        ),
    )


def publish_node_viewed(
    *,
    session: ConnectorSession,
    call_id: str,
    node_id: int,
) -> None:
    publish_connector_event(
        user_id=session.user_id,
        connector=focus_config.CONNECTOR_KEY,
        event=ConnectorAutomationEventPublic(
            event="focus.node.viewed",
            actor=_actor(session),
            call_id=call_id,
            node_ids=[node_id],
            pan_to_node_id=node_id,
        ),
    )
