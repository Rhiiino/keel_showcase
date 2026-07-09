# keel_api/src/modules/focus/reference_registry/search.py

"""Search external rows for the reference picker."""

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
from modules.focus.reference_registry.formatting import contact_display_name
from modules.focus.reference_registry.types import get_reference_type_meta


async def search_reference_targets(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    target_type: str,
    query: str,
    limit: int = 20,
) -> list[dict[str, object]]:
    """Search external rows for the reference picker."""
    meta = get_reference_type_meta(target_type)
    if meta is None:
        return []

    pattern = f"%{query.strip()}%"
    capped_limit = max(1, min(limit, 50))

    if target_type == "project":
        rows = await conn.fetch(
            f"""
            SELECT id, title, status
            FROM {PROJECTS}
            WHERE user_id = $1
              AND title ILIKE $2
            ORDER BY updated_at DESC, id ASC
            LIMIT $3
            """,
            user_id,
            pattern,
            capped_limit,
        )
        return [
            {
                "target_type": target_type,
                "target_id": int(row["id"]),
                "title": row["title"],
                "subtitle": row["status"],
            }
            for row in rows
        ]

    if target_type == "finance_transaction":
        rows = await conn.fetch(
            f"""
            SELECT id, title, kind, status
            FROM {FINANCE_TRANSACTIONS}
            WHERE user_id = $1
              AND title ILIKE $2
            ORDER BY updated_at DESC, id ASC
            LIMIT $3
            """,
            user_id,
            pattern,
            capped_limit,
        )
        return [
            {
                "target_type": target_type,
                "target_id": int(row["id"]),
                "title": row["title"],
                "subtitle": f"{row['kind']} · {row['status']}",
            }
            for row in rows
        ]

    if target_type == "contact":
        rows = await conn.fetch(
            f"""
            SELECT id, first_name, last_name, status
            FROM {CONTACTS}
            WHERE user_id = $1
              AND (
                COALESCE(first_name, '') ILIKE $2
                OR COALESCE(last_name, '') ILIKE $2
                OR trim(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) ILIKE $2
            )
            ORDER BY updated_at DESC, id ASC
            LIMIT $3
            """,
            user_id,
            pattern,
            capped_limit,
        )
        return [
            {
                "target_type": target_type,
                "target_id": int(row["id"]),
                "title": contact_display_name(row["first_name"], row["last_name"]),
                "subtitle": row["status"],
            }
            for row in rows
        ]

    if target_type == "figure":
        rows = await conn.fetch(
            f"""
            SELECT id, first_name, last_name, status
            FROM {FIGURES}
            WHERE user_id = $1
              AND (
                COALESCE(first_name, '') ILIKE $2
                OR COALESCE(last_name, '') ILIKE $2
                OR trim(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) ILIKE $2
            )
            ORDER BY updated_at DESC, id ASC
            LIMIT $3
            """,
            user_id,
            pattern,
            capped_limit,
        )
        return [
            {
                "target_type": target_type,
                "target_id": int(row["id"]),
                "title": contact_display_name(row["first_name"], row["last_name"]),
                "subtitle": row["status"],
            }
            for row in rows
        ]

    if target_type == "agent":
        rows = await conn.fetch(
            f"""
            SELECT id, display_name, key
            FROM {AGENTS}
            WHERE is_enabled = TRUE
              AND (
                display_name ILIKE $1
                OR key ILIKE $1
              )
            ORDER BY sort_order ASC, id ASC
            LIMIT $2
            """,
            pattern,
            capped_limit,
        )
        return [
            {
                "target_type": target_type,
                "target_id": int(row["id"]),
                "title": row["display_name"],
                "subtitle": row["key"],
            }
            for row in rows
        ]

    if target_type == "media_object":
        rows = await conn.fetch(
            f"""
            SELECT id, original_filename, media_kind, status
            FROM {MEDIA_OBJECTS}
            WHERE user_id = $1
              AND status <> 'deleted'
              AND (
                original_filename ILIKE $2
                OR mime_type ILIKE $2
                OR media_kind ILIKE $2
              )
            ORDER BY updated_at DESC, id ASC
            LIMIT $3
            """,
            user_id,
            pattern,
            capped_limit,
        )
        return [
            {
                "target_type": target_type,
                "target_id": str(row["id"]),
                "title": row["original_filename"],
                "subtitle": f"{row['media_kind']} - {row['status']}",
            }
            for row in rows
        ]

    if target_type == "tool":
        rows = await conn.fetch(
            f"""
            SELECT t.id, t.name, tc.display_name AS category_name
            FROM {TOOLS} t
            INNER JOIN {TOOL_CATEGORIES} tc ON tc.id = t.category_id
            WHERE t.is_enabled = TRUE
              AND (
                t.name ILIKE $1
                OR t.description ILIKE $1
              )
            ORDER BY t.name ASC, t.id ASC
            LIMIT $2
            """,
            pattern,
            capped_limit,
        )
        return [
            {
                "target_type": target_type,
                "target_id": int(row["id"]),
                "title": row["name"],
                "subtitle": row["category_name"],
            }
            for row in rows
        ]

    if target_type == "tool_category":
        rows = await conn.fetch(
            f"""
            SELECT id, display_name, key
            FROM {TOOL_CATEGORIES}
            WHERE display_name ILIKE $1 OR key ILIKE $1
            ORDER BY sort_order ASC, id ASC
            LIMIT $2
            """,
            pattern,
            capped_limit,
        )
        return [
            {
                "target_type": target_type,
                "target_id": int(row["id"]),
                "title": row["display_name"],
                "subtitle": row["key"],
            }
            for row in rows
        ]

    return []
