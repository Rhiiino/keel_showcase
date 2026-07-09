# keel_api/src/modules/focus/reference_registry/detail.py

"""Curated reference properties for the constellation inspector."""

from __future__ import annotations

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
from modules.focus.reference_registry.formatting import resolve_reference_properties
from modules.focus.reference_registry.hydrate import (
    _parse_int_target_id,
    _parse_uuid_target_id,
    hydrate_reference_target,
)


async def _fetch_reference_detail_row(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    target_type: str,
    target_id: str,
) -> asyncpg.Record | None:
    if target_type == "project":
        parsed_id = _parse_int_target_id(target_id)
        if parsed_id is None:
            return None
        return await conn.fetchrow(
            f"""
            SELECT title, status, updated_at
            FROM {PROJECTS}
            WHERE id = $1 AND user_id = $2
            """,
            parsed_id,
            user_id,
        )

    if target_type == "finance_transaction":
        parsed_id = _parse_int_target_id(target_id)
        if parsed_id is None:
            return None
        return await conn.fetchrow(
            f"""
            SELECT title, kind, status, updated_at
            FROM {FINANCE_TRANSACTIONS}
            WHERE id = $1 AND user_id = $2
            """,
            parsed_id,
            user_id,
        )

    if target_type == "contact":
        parsed_id = _parse_int_target_id(target_id)
        if parsed_id is None:
            return None
        return await conn.fetchrow(
            f"""
            SELECT first_name, last_name, status, updated_at
            FROM {CONTACTS}
            WHERE id = $1 AND user_id = $2
            """,
            parsed_id,
            user_id,
        )

    if target_type == "figure":
        parsed_id = _parse_int_target_id(target_id)
        if parsed_id is None:
            return None
        return await conn.fetchrow(
            f"""
            SELECT first_name, last_name, status, updated_at
            FROM {FIGURES}
            WHERE id = $1 AND user_id = $2
            """,
            parsed_id,
            user_id,
        )

    if target_type == "agent":
        parsed_id = _parse_int_target_id(target_id)
        if parsed_id is None:
            return None
        return await conn.fetchrow(
            f"""
            SELECT display_name, key
            FROM {AGENTS}
            WHERE id = $1
            """,
            parsed_id,
        )

    if target_type == "media_object":
        parsed_id = _parse_uuid_target_id(target_id)
        if parsed_id is None:
            return None
        return await conn.fetchrow(
            f"""
            SELECT original_filename, media_kind, mime_type, byte_size, updated_at
            FROM {MEDIA_OBJECTS}
            WHERE id = $1 AND user_id = $2 AND status <> 'deleted'
            """,
            parsed_id,
            user_id,
        )

    if target_type == "tool":
        parsed_id = _parse_int_target_id(target_id)
        if parsed_id is None:
            return None
        return await conn.fetchrow(
            f"""
            SELECT t.name, tc.display_name AS category_name
            FROM {TOOLS} t
            INNER JOIN {TOOL_CATEGORIES} tc ON tc.id = t.category_id
            WHERE t.id = $1
            """,
            parsed_id,
        )

    if target_type == "tool_category":
        parsed_id = _parse_int_target_id(target_id)
        if parsed_id is None:
            return None
        return await conn.fetchrow(
            f"""
            SELECT display_name, key
            FROM {TOOL_CATEGORIES}
            WHERE id = $1
            """,
            parsed_id,
        )

    return None


async def get_reference_detail(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    target_type: str,
    target_id: str,
) -> dict[str, object]:
    """Load curated reference properties for the constellation inspector."""
    hydrated = await hydrate_reference_target(
        conn,
        user_id=user_id,
        target_type=target_type,
        target_id=target_id,
    )
    if hydrated is None:
        return {
            "target_type": target_type,
            "target_id": target_id,
            "title": "Missing reference",
            "is_missing": True,
            "properties": [],
        }

    detail_row = await _fetch_reference_detail_row(
        conn,
        user_id=user_id,
        target_type=target_type,
        target_id=target_id,
    )
    properties: list[dict[str, str]] = []
    if detail_row is not None:
        properties = resolve_reference_properties(target_type, detail_row)

    return {
        "target_type": target_type,
        "target_id": target_id,
        "title": str(hydrated["title"]),
        "is_missing": False,
        "properties": properties,
    }
