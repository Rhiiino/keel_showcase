# keel_api/src/modules/focus/service/helpers.py

"""Shared validation, mapping, and preference helpers for Focus service."""

from __future__ import annotations

import json
import re
from typing import Any

import asyncpg

from core.errors import AppError
from modules.focus import config, reference_registry
from modules.focus.repository import nodes as nodes_repository
from modules.focus.repository import tags as tags_repository
from modules.focus.schemas import FocusNodePublic, FocusReferenceTargetSummary, FocusTagPublic
from modules.settings import repository as settings_repository

_HEX_COLOR_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")



def decode_preferences_data(value: object) -> dict[str, Any]:
    if value is None:
        return {}
    if isinstance(value, dict):
        return dict(value)
    if isinstance(value, str):
        parsed = json.loads(value)
        if isinstance(parsed, dict):
            return dict(parsed)
    return {}


def record_to_tag(row: asyncpg.Record) -> FocusTagPublic:
    return FocusTagPublic(
        id=int(row["id"]),
        name=row["name"],
        color_hex=row["color_hex"],
    )


def normalize_title(title: str, *, field_name: str = "title") -> str:
    normalized = title.strip()
    if not normalized:
        raise AppError(f"{field_name} cannot be empty.", status_code=400)
    return normalized


def normalize_tag_name(name: str) -> str:
    normalized = name.strip()
    if not normalized:
        raise AppError("Tag name cannot be empty.", status_code=400)
    return normalized


def normalize_tag_color(color_hex: str | None) -> str:
    if color_hex is None:
        return config.DEFAULT_TAG_COLOR_HEX
    normalized = color_hex.strip()
    if not _HEX_COLOR_PATTERN.fullmatch(normalized):
        raise AppError("color_hex must be a six-digit hex color like #06B6D4.", status_code=400)
    return normalized.upper()


def normalize_node_color_hex(color_hex: str | None) -> str | None:
    if color_hex is None:
        return None
    normalized = color_hex.strip()
    if not normalized:
        return None
    if not _HEX_COLOR_PATTERN.fullmatch(normalized):
        raise AppError(
            "node_color_hex must be a six-digit hex color like #38BDF8.",
            status_code=400,
        )
    return normalized.upper()


def normalize_title_font_key(title_font_key: str | None) -> str | None:
    if title_font_key is None:
        return None
    normalized = title_font_key.strip().lower()
    if not normalized:
        return None
    if normalized not in config.ALLOWED_TITLE_FONT_KEYS:
        allowed = ", ".join(sorted(config.ALLOWED_TITLE_FONT_KEYS))
        raise AppError(f"title_font_key must be one of: {allowed}.", status_code=400)
    return normalized


def validate_node_kind(kind: str) -> str:
    normalized = kind.strip().lower()
    if normalized not in config.VALID_NODE_KINDS:
        raise AppError("kind must be item, list, or record.", status_code=400)
    return normalized


def validate_node_status(status: str) -> str:
    normalized = status.strip().lower()
    if normalized not in config.VALID_NODE_STATUSES:
        raise AppError(
            "status must be active, paused, completed, archived, or limbo.",
            status_code=400,
        )
    return normalized


def validate_work_order(work_order: int | None) -> int | None:
    if work_order is None:
        return None
    if work_order < 0:
        raise AppError("work_order must be zero or greater.", status_code=400)
    return work_order


async def load_owned_node(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    node_id: int,
) -> asyncpg.Record:
    row = await nodes_repository.get_focus_node(conn, user_id=user_id, node_id=node_id)
    if row is None:
        raise AppError("Focus node not found.", status_code=404)
    return row


async def validate_container_parent(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    parent_id: int,
) -> asyncpg.Record:
    parent = await load_owned_node(conn, user_id=user_id, node_id=parent_id)
    if parent["kind"] not in config.VALID_CONTAINER_KINDS:
        raise AppError("Parent must be a list or record node.", status_code=400)
    return parent


async def validate_tag_ids(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_ids: list[int] | None,
) -> None:
    if tag_ids is None:
        return
    owned = await tags_repository.count_owned_tags(
        conn,
        user_id=user_id,
        tag_ids=tag_ids,
    )
    if owned != len(set(tag_ids)):
        raise AppError("One or more tags were not found.", status_code=400)


async def would_create_parent_cycle(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    node_id: int,
    new_parent_id: int,
) -> bool:
    if node_id == new_parent_id:
        return True
    current: int | None = new_parent_id
    depth = 0
    while current is not None and depth < config.MAX_PARENT_DEPTH:
        if current == node_id:
            return True
        current = await nodes_repository.get_focus_node_parent_id(
            conn,
            user_id=user_id,
            node_id=current,
        )
        depth += 1
    return False


async def read_reference_enabled_types(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[str]:
    row = await settings_repository.get_user_preferences(conn, user_id)
    data = decode_preferences_data(row["data"] if row is not None else None)
    focus_data = data.get("focus")
    enabled: list[str] | None = None
    if isinstance(focus_data, dict):
        raw = focus_data.get(config.PREFERENCES_REFERENCE_ENABLED_TYPES_KEY)
        if isinstance(raw, list):
            enabled = [str(item) for item in raw]
    return reference_registry.normalize_enabled_types(enabled)


async def write_reference_enabled_types(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    enabled_types: list[str],
) -> None:
    row = await settings_repository.get_user_preferences(conn, user_id)
    data = decode_preferences_data(row["data"] if row is not None else None)
    focus_data = dict(data.get("focus", {})) if isinstance(data.get("focus"), dict) else {}
    focus_data[config.PREFERENCES_REFERENCE_ENABLED_TYPES_KEY] = enabled_types
    data["focus"] = focus_data
    await settings_repository.upsert_user_preferences(conn, user_id=user_id, data=data)


async def hydrate_reference_summary(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    target_type: str,
    target_id: str,
) -> FocusReferenceTargetSummary:
    hydrated = await reference_registry.hydrate_reference_target(
        conn,
        user_id=user_id,
        target_type=target_type,
        target_id=target_id,
    )
    if hydrated is None:
        return FocusReferenceTargetSummary(
            target_type=target_type,
            target_id=target_id,
            title="Missing reference",
            subtitle=None,
            is_missing=True,
            web_path=None,
        )
    return FocusReferenceTargetSummary(
        target_type=str(hydrated["target_type"]),
        target_id=str(hydrated["target_id"]),
        title=str(hydrated["title"]),
        subtitle=(
            str(hydrated["subtitle"]) if hydrated.get("subtitle") is not None else None
        ),
        is_missing=bool(hydrated.get("is_missing", False)),
        web_path=(
            str(hydrated["web_path"]) if hydrated.get("web_path") is not None else None
        ),
        mime_type=(
            str(hydrated["mime_type"]) if hydrated.get("mime_type") is not None else None
        ),
        media_kind=(
            str(hydrated["media_kind"]) if hydrated.get("media_kind") is not None else None
        ),
        content_updated_at=hydrated.get("content_updated_at"),
    )


def build_tree(
    rows: list[asyncpg.Record],
    *,
    reference_map: dict[int, FocusReferenceTargetSummary],
    child_counts: dict[int, int],
    tag_map: dict[int, list[FocusTagPublic]],
) -> list[FocusNodePublic]:
    nodes_by_id: dict[int, FocusNodePublic] = {}
    presentation_kinds = config.CONTAINER_PRESENTATION_KINDS
    for row in rows:
        node_id = int(row["id"])
        kind = row["kind"]
        is_presentation = kind in presentation_kinds
        nodes_by_id[node_id] = FocusNodePublic(
            id=node_id,
            user_id=int(row["user_id"]),
            parent_id=row["parent_id"],
            kind=kind,
            sort_order=int(row["sort_order"]),
            title=row["title"],
            notes=row["notes"],
            status=row["status"],
            completed_at=row["completed_at"],
            work_order=row["work_order"],
            node_color_hex=row["node_color_hex"] if is_presentation else None,
            title_font_key=row["title_font_key"] if is_presentation else None,
            is_origin=bool(row["is_origin"]) if kind == "list" else False,
            reference_target=reference_map.get(node_id),
            show_reference_content=(
                bool(row["show_reference_content"]) if kind == "record" else False
            ),
            child_count=child_counts.get(node_id, 0),
            tags=tag_map.get(node_id, []) if is_presentation else [],
            children=[],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    roots: list[FocusNodePublic] = []
    for node in nodes_by_id.values():
        if node.parent_id is None or node.parent_id not in nodes_by_id:
            roots.append(node)
            continue
        parent = nodes_by_id[node.parent_id]
        parent.children.append(node)

    for node in nodes_by_id.values():
        node.children.sort(key=lambda entry: (entry.sort_order, entry.id))

    roots.sort(key=lambda entry: (entry.sort_order, entry.id))
    return roots


async def map_nodes(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    rows: list[asyncpg.Record],
    include_children: bool = False,
) -> list[FocusNodePublic]:
    if not rows:
        return []

    node_ids = [int(row["id"]) for row in rows]
    child_counts = await nodes_repository.count_children_for_nodes(conn, node_ids)
    list_ids = [
        int(row["id"])
        for row in rows
        if row["kind"] in config.CONTAINER_PRESENTATION_KINDS
    ]
    tag_rows = await tags_repository.fetch_tags_for_nodes(conn, list_ids)
    tag_map = {
        node_id: [record_to_tag(tag_row) for tag_row in tag_rows.get(node_id, [])]
        for node_id in list_ids
    }

    reference_map: dict[int, FocusReferenceTargetSummary] = {}
    for row in rows:
        if row["kind"] != "record":
            continue
        node_id = int(row["id"])
        reference_map[node_id] = await hydrate_reference_summary(
            conn,
            user_id=user_id,
            target_type=row["reference_target_type"],
            target_id=str(row["reference_target_id"]),
        )

    if include_children:
        return build_tree(
            rows,
            reference_map=reference_map,
            child_counts=child_counts,
            tag_map=tag_map,
        )

    return [
        build_tree(
            [row],
            reference_map=reference_map,
            child_counts=child_counts,
            tag_map=tag_map,
        )[0]
        for row in rows
    ]


async def map_single_node(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    row: asyncpg.Record,
) -> FocusNodePublic:
    mapped = await map_nodes(conn, user_id=user_id, rows=[row])
    return mapped[0]
