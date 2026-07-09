# keel_api/src/modules/journal/repository/tags.py

"""SQL access for journal tags and entry-tag assignments."""

from __future__ import annotations

import asyncpg

from core.tables import (
    JOURNAL_ENTRIES,
    JOURNAL_ENTRY_TAG_ASSIGNMENTS,
    JOURNAL_TAGS,
)

_TAG_COLUMNS = "id, user_id, name, color_hex, created_at, updated_at"


async def list_user_tags(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List tag rows for a user."""
    return await conn.fetch(
        f"""
        SELECT
            t.id,
            t.user_id,
            t.name,
            t.color_hex,
            t.created_at,
            t.updated_at,
            COUNT(DISTINCT je.id)::int AS entry_count
        FROM {JOURNAL_TAGS} t
        LEFT JOIN {JOURNAL_ENTRY_TAG_ASSIGNMENTS} jeta ON jeta.tag_id = t.id
        LEFT JOIN {JOURNAL_ENTRIES} je
            ON je.id = jeta.journal_entry_id
            AND je.user_id = t.user_id
        WHERE t.user_id = $1
        GROUP BY t.id, t.user_id, t.name, t.color_hex, t.created_at, t.updated_at
        ORDER BY t.name ASC, t.id ASC
        """,
        user_id,
    )


async def get_user_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_id: int,
) -> asyncpg.Record | None:
    """Fetch one tag row owned by a user."""
    return await conn.fetchrow(
        f"""
        SELECT {_TAG_COLUMNS}
        FROM {JOURNAL_TAGS}
        WHERE id = $1 AND user_id = $2
        """,
        tag_id,
        user_id,
    )


async def insert_user_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    name: str,
    color_hex: str,
) -> asyncpg.Record:
    """Insert a new user tag row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {JOURNAL_TAGS} (user_id, name, color_hex)
        VALUES ($1, $2, $3)
        RETURNING {_TAG_COLUMNS}
        """,
        user_id,
        name,
        color_hex,
    )
    if row is None:
        raise RuntimeError("Failed to insert journal tag.")
    return row


async def update_user_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_id: int,
    name: str | None,
    color_hex: str | None,
) -> asyncpg.Record | None:
    """Update one user tag row."""
    return await conn.fetchrow(
        f"""
        UPDATE {JOURNAL_TAGS}
        SET
            name = COALESCE($3, name),
            color_hex = COALESCE($4, color_hex),
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING {_TAG_COLUMNS}
        """,
        tag_id,
        user_id,
        name,
        color_hex,
    )


async def delete_user_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_id: int,
) -> bool:
    """Delete one user tag row."""
    result = await conn.execute(
        f"""
        DELETE FROM {JOURNAL_TAGS}
        WHERE id = $1 AND user_id = $2
        """,
        tag_id,
        user_id,
    )
    return result.endswith("1")


async def fetch_tags_for_entries(
    conn: asyncpg.Connection,
    entry_ids: list[int],
) -> dict[int, list[asyncpg.Record]]:
    """Load tags grouped by journal entry id."""
    if not entry_ids:
        return {}

    rows = await conn.fetch(
        f"""
        SELECT
            jeta.journal_entry_id,
            t.id,
            t.name,
            t.color_hex
        FROM {JOURNAL_ENTRY_TAG_ASSIGNMENTS} jeta
        INNER JOIN {JOURNAL_TAGS} t ON t.id = jeta.tag_id
        WHERE jeta.journal_entry_id = ANY($1::int[])
        ORDER BY t.name ASC, t.id ASC
        """,
        entry_ids,
    )

    grouped: dict[int, list[asyncpg.Record]] = {entry_id: [] for entry_id in entry_ids}
    for row in rows:
        grouped[row["journal_entry_id"]].append(row)
    return grouped


async def replace_entry_tags(
    conn: asyncpg.Connection,
    *,
    entry_id: int,
    tag_ids: list[int],
) -> None:
    """Replace tag associations for a journal entry."""
    await conn.execute(
        f"""
        DELETE FROM {JOURNAL_ENTRY_TAG_ASSIGNMENTS}
        WHERE journal_entry_id = $1
        """,
        entry_id,
    )

    if not tag_ids:
        return

    await conn.executemany(
        f"""
        INSERT INTO {JOURNAL_ENTRY_TAG_ASSIGNMENTS} (journal_entry_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        """,
        [(entry_id, tag_id) for tag_id in tag_ids],
    )


async def count_owned_tags(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_ids: list[int],
) -> int:
    """Count how many tag ids belong to a user."""
    if not tag_ids:
        return 0

    return await conn.fetchval(
        f"""
        SELECT COUNT(*)
        FROM {JOURNAL_TAGS}
        WHERE user_id = $1 AND id = ANY($2::int[])
        """,
        user_id,
        tag_ids,
    )
