# keel_api/src/modules/journal/repository/entries.py

"""SQL access for journal entries."""

from __future__ import annotations

from datetime import date

import asyncpg

from core.tables import JOURNAL_ENTRIES, JOURNAL_ENTRY_TAG_ASSIGNMENTS

_ENTRY_COLUMNS = (
    "e.id, e.user_id, e.entry_date, e.content, e.created_at, e.updated_at"
)

_ENTRY_RETURNING = "id, user_id, entry_date, content, created_at, updated_at"



# ----- Journal entries table operations
async def list_entries(
    conn: asyncpg.Connection,
    user_id: int,
    *,
    query: str | None = None,
    entry_date_from: date | None = None,
    entry_date_to: date | None = None,
    tag_ids: list[int] | None = None,
) -> list[asyncpg.Record]:
    """List journal entry rows for a user with optional filters."""
    conditions = ["e.user_id = $1"]
    params: list[object] = [user_id]
    param_index = 2

    if query and query.strip():
        pattern = f"%{query.strip()}%"
        conditions.append(f"e.content ILIKE ${param_index}")
        params.append(pattern)
        param_index += 1

    if entry_date_to is not None:
        conditions.append(f"e.entry_date <= ${param_index}")
        params.append(entry_date_to)
        param_index += 1

    if entry_date_from is not None:
        conditions.append(f"e.entry_date >= ${param_index}")
        params.append(entry_date_from)
        param_index += 1

    if tag_ids:
        conditions.append(
            f"""
            EXISTS (
                SELECT 1
                FROM {JOURNAL_ENTRY_TAG_ASSIGNMENTS} jeta_filter
                WHERE jeta_filter.journal_entry_id = e.id
                  AND jeta_filter.tag_id = ANY(${param_index}::int[])
            )
            """
        )
        params.append(tag_ids)
        param_index += 1

    where_clause = " AND ".join(conditions)
    return await conn.fetch(
        f"""
        SELECT {_ENTRY_COLUMNS}
        FROM {JOURNAL_ENTRIES} e
        WHERE {where_clause}
        ORDER BY e.entry_date DESC, e.id DESC
        """,
        *params,
    )


async def get_entry(
    conn: asyncpg.Connection,
    entry_id: int,
) -> asyncpg.Record | None:
    """Fetch one journal entry row by id."""
    return await conn.fetchrow(
        f"""
        SELECT {_ENTRY_COLUMNS}
        FROM {JOURNAL_ENTRIES} e
        WHERE e.id = $1
        """,
        entry_id,
    )


async def insert_entry(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    entry_date: date,
    content: str,
) -> asyncpg.Record:
    """Insert a journal entry row."""
    return await conn.fetchrow(
        f"""
        INSERT INTO {JOURNAL_ENTRIES} (user_id, entry_date, content)
        VALUES ($1, $2, $3)
        RETURNING {_ENTRY_RETURNING}
        """,
        user_id,
        entry_date,
        content,
    )


async def update_entry(
    conn: asyncpg.Connection,
    entry_id: int,
    *,
    entry_date: date,
    content: str,
) -> asyncpg.Record | None:
    """Update one journal entry row."""
    return await conn.fetchrow(
        f"""
        UPDATE {JOURNAL_ENTRIES}
        SET
            entry_date = $2,
            content = $3,
            updated_at = NOW()
        WHERE id = $1
        RETURNING {_ENTRY_RETURNING}
        """,
        entry_id,
        entry_date,
        content,
    )


async def delete_entry(
    conn: asyncpg.Connection,
    entry_id: int,
) -> str | None:
    """Delete one journal entry row. Returns deleted id as string or None."""
    return await conn.fetchval(
        f"""
        DELETE FROM {JOURNAL_ENTRIES}
        WHERE id = $1
        RETURNING id::text
        """,
        entry_id,
    )
