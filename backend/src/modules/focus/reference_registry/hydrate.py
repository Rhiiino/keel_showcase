# keel_api/src/modules/focus/reference_registry/hydrate.py

"""Load external rows for display on record nodes."""

from __future__ import annotations

from uuid import UUID

import asyncpg

from core.tables import (
    AGENTS,
    CONTACTS,
    FIGURES,
    MEDIA_OBJECTS,
    PROJECTS,
    FINANCE_TRANSACTIONS,
    TOOL_CATEGORIES,
    TOOLS,
)
from modules.focus.reference_registry.formatting import contact_display_name
from modules.focus.reference_registry.types import get_reference_type_meta


def _parse_int_target_id(target_id: str) -> int | None:
    try:
        parsed = int(str(target_id).strip())
    except (TypeError, ValueError):
        return None
    return parsed if parsed > 0 else None


def _parse_uuid_target_id(target_id: str) -> UUID | None:
    try:
        return UUID(str(target_id).strip())
    except (TypeError, ValueError):
        return None


async def hydrate_reference_target(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    target_type: str,
    target_id: str,
) -> dict[str, object] | None:
    """Load one external row for display on a record node."""
    meta = get_reference_type_meta(target_type)
    if meta is None:
        return None

    if target_type == "project":
        parsed_id = _parse_int_target_id(target_id)
        if parsed_id is None:
            return None
        row = await conn.fetchrow(
            f"""
            SELECT id, title, status
            FROM {PROJECTS}
            WHERE id = $1 AND user_id = $2
            """,
            parsed_id,
            user_id,
        )
        if row is None:
            return None
        return {
            "target_type": target_type,
            "target_id": str(row["id"]),
            "title": row["title"],
            "subtitle": row["status"],
            "is_missing": False,
            "web_path": meta.web_path(str(row["id"])),
        }

    if target_type == "finance_transaction":
        parsed_id = _parse_int_target_id(target_id)
        if parsed_id is None:
            return None
        row = await conn.fetchrow(
            f"""
            SELECT id, title, kind, status
            FROM {FINANCE_TRANSACTIONS}
            WHERE id = $1 AND user_id = $2
            """,
            parsed_id,
            user_id,
        )
        if row is None:
            return None
        return {
            "target_type": target_type,
            "target_id": str(row["id"]),
            "title": row["title"],
            "subtitle": f"{row['kind']} · {row['status']}",
            "is_missing": False,
            "web_path": meta.web_path(str(row["id"])),
        }

    if target_type == "contact":
        parsed_id = _parse_int_target_id(target_id)
        if parsed_id is None:
            return None
        row = await conn.fetchrow(
            f"""
            SELECT id, first_name, last_name, status
            FROM {CONTACTS}
            WHERE id = $1 AND user_id = $2
            """,
            parsed_id,
            user_id,
        )
        if row is None:
            return None
        return {
            "target_type": target_type,
            "target_id": str(row["id"]),
            "title": contact_display_name(row["first_name"], row["last_name"]),
            "subtitle": row["status"],
            "is_missing": False,
            "web_path": meta.web_path(str(row["id"])),
        }

    if target_type == "figure":
        parsed_id = _parse_int_target_id(target_id)
        if parsed_id is None:
            return None
        row = await conn.fetchrow(
            f"""
            SELECT id, first_name, last_name, status
            FROM {FIGURES}
            WHERE id = $1 AND user_id = $2
            """,
            parsed_id,
            user_id,
        )
        if row is None:
            return None
        return {
            "target_type": target_type,
            "target_id": str(row["id"]),
            "title": contact_display_name(row["first_name"], row["last_name"]),
            "subtitle": row["status"],
            "is_missing": False,
            "web_path": meta.web_path(str(row["id"])),
        }

    if target_type == "agent":
        parsed_id = _parse_int_target_id(target_id)
        if parsed_id is None:
            return None
        row = await conn.fetchrow(
            f"""
            SELECT id, display_name, key
            FROM {AGENTS}
            WHERE id = $1
            """,
            parsed_id,
        )
        if row is None:
            return None
        return {
            "target_type": target_type,
            "target_id": str(row["id"]),
            "title": row["display_name"],
            "subtitle": row["key"],
            "is_missing": False,
            "web_path": meta.web_path(str(row["id"])),
        }

    if target_type == "media_object":
        parsed_id = _parse_uuid_target_id(target_id)
        if parsed_id is None:
            return None
        row = await conn.fetchrow(
            f"""
            SELECT id, original_filename, media_kind, mime_type, status, updated_at
            FROM {MEDIA_OBJECTS}
            WHERE id = $1 AND user_id = $2 AND status <> 'deleted'
            """,
            parsed_id,
            user_id,
        )
        if row is None:
            return None
        return {
            "target_type": target_type,
            "target_id": str(row["id"]),
            "title": row["original_filename"],
            "subtitle": f"{row['media_kind']} - {row['status']}",
            "is_missing": False,
            "web_path": meta.web_path(str(row["id"])),
            "mime_type": row["mime_type"],
            "media_kind": row["media_kind"],
            "content_updated_at": row["updated_at"],
        }

    if target_type == "tool":
        parsed_id = _parse_int_target_id(target_id)
        if parsed_id is None:
            return None
        row = await conn.fetchrow(
            f"""
            SELECT t.id, t.name, tc.display_name AS category_name
            FROM {TOOLS} t
            INNER JOIN {TOOL_CATEGORIES} tc ON tc.id = t.category_id
            WHERE t.id = $1
            """,
            parsed_id,
        )
        if row is None:
            return None
        return {
            "target_type": target_type,
            "target_id": str(row["id"]),
            "title": row["name"],
            "subtitle": row["category_name"],
            "is_missing": False,
            "web_path": meta.web_path(str(row["id"])),
        }

    if target_type == "tool_category":
        parsed_id = _parse_int_target_id(target_id)
        if parsed_id is None:
            return None
        row = await conn.fetchrow(
            f"""
            SELECT id, display_name, key
            FROM {TOOL_CATEGORIES}
            WHERE id = $1
            """,
            parsed_id,
        )
        if row is None:
            return None
        return {
            "target_type": target_type,
            "target_id": str(row["id"]),
            "title": row["display_name"],
            "subtitle": row["key"],
            "is_missing": False,
            "web_path": meta.web_path(str(row["id"])),
        }

    return None


async def reference_target_exists(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    target_type: str,
    target_id: str,
) -> bool:
    """Return True when the external row exists (and is accessible when user-scoped)."""
    hydrated = await hydrate_reference_target(
        conn,
        user_id=user_id,
        target_type=target_type,
        target_id=target_id,
    )
    return hydrated is not None
