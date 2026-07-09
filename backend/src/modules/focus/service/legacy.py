# keel_api/src/modules/focus/service/legacy.py

"""Legacy LLM tool compatibility using list/entry vocabulary."""

from __future__ import annotations

from typing import Any

from core.errors import AppError
from modules.focus.schemas import FocusNodeCreate, FocusNodePublic, FocusNodeUpdate
from modules.focus.service.nodes import (
    complete_focus_node,
    create_focus_node,
    delete_focus_node,
    get_focus_node,
    list_focus_nodes,
    update_focus_node,
)



def node_to_legacy_list(node: FocusNodePublic) -> dict[str, Any]:
    return {
        "id": node.id,
        "user_id": node.user_id,
        "title": node.title,
        "notes": node.notes or "",
        "status": node.status or "active",
        "work_order": node.work_order,
        "sort_order": node.sort_order,
        "node_color_hex": node.node_color_hex,
        "title_font_key": node.title_font_key,
        "is_origin": node.is_origin,
        "item_count": node.child_count,
        "tags": [tag.model_dump(mode="json") for tag in node.tags],
        "created_at": node.created_at,
        "updated_at": node.updated_at,
    }


def node_to_legacy_entry(node: FocusNodePublic) -> dict[str, Any]:
    if node.kind == "list":
        return {
            "id": node.id,
            "user_id": node.user_id,
            "list_id": node.parent_id,
            "kind": "list_link",
            "linked_list_id": node.id,
            "linked_list": {
                "id": node.id,
                "title": node.title,
                "notes": node.notes or "",
                "node_color_hex": node.node_color_hex,
                "title_font_key": node.title_font_key,
                "entry_count": node.child_count,
                "tags": [tag.model_dump(mode="json") for tag in node.tags],
            },
            "title": node.title,
            "notes": "",
            "status": node.status or "active",
            "work_order": node.work_order,
            "sort_order": node.sort_order,
            "completed_at": None,
            "created_at": node.created_at,
            "updated_at": node.updated_at,
        }
    if node.kind == "record":
        target = node.reference_target
        return {
            "id": node.id,
            "user_id": node.user_id,
            "list_id": node.parent_id,
            "kind": "record",
            "linked_list_id": None,
            "linked_list": None,
            "title": node.title,
            "notes": "",
            "status": node.status or "active",
            "work_order": node.work_order,
            "sort_order": node.sort_order,
            "node_color_hex": node.node_color_hex,
            "title_font_key": node.title_font_key,
            "completed_at": None,
            "reference_target": target.model_dump(mode="json") if target else None,
            "created_at": node.created_at,
            "updated_at": node.updated_at,
        }
    return {
        "id": node.id,
        "user_id": node.user_id,
        "list_id": node.parent_id,
        "kind": "task",
        "linked_list_id": None,
        "linked_list": None,
        "title": node.title,
        "notes": node.notes or "",
        "status": node.status or "active",
        "work_order": node.work_order,
        "sort_order": node.sort_order,
        "completed_at": node.completed_at,
        "created_at": node.created_at,
        "updated_at": node.updated_at,
    }


def flatten_legacy_entries(node: FocusNodePublic) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for child in node.children:
        entries.append(node_to_legacy_entry(child))
    return entries


async def list_focus_lists(
    user_id: int,
    *,
    status: str | None = None,
) -> list[dict[str, Any]]:
    nodes = await list_focus_nodes(
        user_id,
        hub_lists_only=True,
        status=status,
    )
    return [node_to_legacy_list(node) for node in nodes]


async def get_focus_list(user_id: int, list_id: int) -> dict[str, Any]:
    node = await get_focus_node(user_id, list_id, include_subtree=True)
    if node.kind != "list":
        raise AppError("Focus list not found.", status_code=404)
    payload = node_to_legacy_list(node)
    payload["entries"] = flatten_legacy_entries(node)
    return payload


async def create_focus_list(user_id: int, payload: Any) -> dict[str, Any]:
    create_payload = FocusNodeCreate(
        kind="list",
        title=payload.title,
        notes=payload.notes,
        status=payload.status,
        sort_order=payload.sort_order,
        work_order=payload.work_order if hasattr(payload, "work_order") else None,
        node_color_hex=payload.node_color_hex,
        title_font_key=payload.title_font_key,
        is_origin=payload.is_origin,
        tag_ids=payload.tag_ids,
    )
    node = await create_focus_node(user_id, create_payload)
    return node_to_legacy_list(node)


async def update_focus_list(user_id: int, list_id: int, payload: Any) -> dict[str, Any]:
    update_payload = FocusNodeUpdate(
        title=payload.title,
        notes=payload.notes,
        status=payload.status,
        sort_order=payload.sort_order,
        work_order=payload.work_order if hasattr(payload, "work_order") else None,
        node_color_hex=payload.node_color_hex,
        title_font_key=payload.title_font_key,
        is_origin=payload.is_origin,
        tag_ids=payload.tag_ids,
    )
    node = await update_focus_node(user_id, list_id, update_payload)
    return node_to_legacy_list(node)


async def delete_focus_list(user_id: int, list_id: int) -> None:
    await delete_focus_node(user_id, list_id)


async def list_focus_entries(
    user_id: int,
    *,
    list_id: int | None = None,
    status: str | None = None,
    kind: str | None = None,
) -> list[dict[str, Any]]:
    if list_id is None:
        raise AppError("list_id is required.", status_code=400)
    parent = await get_focus_node(user_id, list_id, include_subtree=True)
    entries = flatten_legacy_entries(parent)
    if status is not None:
        entries = [entry for entry in entries if entry["status"] == status]
    if kind is not None:
        entries = [entry for entry in entries if entry["kind"] == kind]
    return entries


async def create_focus_entry(user_id: int, payload: Any) -> dict[str, Any]:
    parent_id = int(payload.list_id)
    entry_kind = str(payload.kind or "task")
    if entry_kind == "list_link":
        if payload.linked_list_id is not None:
            node = await update_focus_node(
                user_id,
                int(payload.linked_list_id),
                FocusNodeUpdate(parent_id=parent_id, title=payload.title),
            )
            return node_to_legacy_entry(node)
        inline = payload.linked_list
        create_payload = FocusNodeCreate(
            kind="list",
            parent_id=parent_id,
            title=payload.title,
            notes=inline.notes if inline else "",
            node_color_hex=inline.node_color_hex if inline else None,
            title_font_key=inline.title_font_key if inline else None,
            tag_ids=inline.tag_ids if inline else None,
            sort_order=payload.sort_order,
        )
        node = await create_focus_node(user_id, create_payload)
        return node_to_legacy_entry(node)
    create_payload = FocusNodeCreate(
        kind="item",
        parent_id=parent_id,
        title=payload.title,
        notes=payload.notes,
        status=payload.status,
        sort_order=payload.sort_order,
    )
    node = await create_focus_node(user_id, create_payload)
    return node_to_legacy_entry(node)


async def update_focus_entry(user_id: int, entry_id: int, payload: Any) -> dict[str, Any]:
    update_payload = FocusNodeUpdate(
        title=payload.title,
        notes=payload.notes,
        parent_id=payload.list_id,
        status=payload.status,
        sort_order=payload.sort_order,
    )
    node = await update_focus_node(user_id, entry_id, update_payload)
    return node_to_legacy_entry(node)


async def complete_focus_entry(user_id: int, entry_id: int) -> dict[str, Any]:
    node = await complete_focus_node(user_id, entry_id)
    return node_to_legacy_entry(node)


async def delete_focus_entry(user_id: int, entry_id: int) -> None:
    await delete_focus_node(user_id, entry_id)
