# keel_api/src/modules/finance/obligation_tag_repository.py

"""SQL access for finance obligation tags and obligation-tag assignments."""

from __future__ import annotations

import asyncpg

from core.tables import (
    FINANCE_OBLIGATION_TAG_ASSIGNMENTS,
    FINANCE_OBLIGATION_TAGS,
    FINANCE_OBLIGATIONS,
)

_TAG_COLUMNS = "id, user_id, name, description, color_hex, created_at, updated_at"



# ----- Obligation tags table operations
async def list_user_tags(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List obligation tag rows for a user."""
    return await conn.fetch(
        f"""
        SELECT
            t.id,
            t.user_id,
            t.name,
            t.description,
            t.color_hex,
            t.created_at,
            t.updated_at,
            COUNT(DISTINCT o.id)::int AS obligation_count
        FROM {FINANCE_OBLIGATION_TAGS} t
        LEFT JOIN {FINANCE_OBLIGATION_TAG_ASSIGNMENTS} ota ON ota.tag_id = t.id
        LEFT JOIN {FINANCE_OBLIGATIONS} o
            ON o.id = ota.obligation_id
            AND o.user_id = t.user_id
        WHERE t.user_id = $1
        GROUP BY t.id, t.user_id, t.name, t.description, t.color_hex, t.created_at, t.updated_at
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
    """Fetch one obligation tag row owned by a user."""
    return await conn.fetchrow(
        f"""
        SELECT {_TAG_COLUMNS}
        FROM {FINANCE_OBLIGATION_TAGS}
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
    description: str | None,
    color_hex: str,
) -> asyncpg.Record:
    """Insert a new obligation tag row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {FINANCE_OBLIGATION_TAGS} (user_id, name, description, color_hex)
        VALUES ($1, $2, $3, $4)
        RETURNING {_TAG_COLUMNS}
        """,
        user_id,
        name,
        description,
        color_hex,
    )
    if row is None:
        raise RuntimeError("Failed to insert finance obligation tag.")
    return row


async def update_user_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_id: int,
    name: str,
    description: str | None,
    color_hex: str,
) -> asyncpg.Record | None:
    """Update one obligation tag row."""
    return await conn.fetchrow(
        f"""
        UPDATE {FINANCE_OBLIGATION_TAGS}
        SET
            name = $3,
            description = $4,
            color_hex = $5,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING {_TAG_COLUMNS}
        """,
        tag_id,
        user_id,
        name,
        description,
        color_hex,
    )


async def delete_user_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_id: int,
) -> bool:
    """Delete one obligation tag row."""
    result = await conn.execute(
        f"""
        DELETE FROM {FINANCE_OBLIGATION_TAGS}
        WHERE id = $1 AND user_id = $2
        """,
        tag_id,
        user_id,
    )
    return result.endswith("1")


async def fetch_tags_for_obligations(
    conn: asyncpg.Connection,
    obligation_ids: list[int],
) -> dict[int, list[asyncpg.Record]]:
    """Load tags grouped by obligation id."""
    if not obligation_ids:
        return {}

    rows = await conn.fetch(
        f"""
        SELECT
            ota.obligation_id,
            t.id,
            t.name,
            t.description,
            t.color_hex
        FROM {FINANCE_OBLIGATION_TAG_ASSIGNMENTS} ota
        INNER JOIN {FINANCE_OBLIGATION_TAGS} t ON t.id = ota.tag_id
        WHERE ota.obligation_id = ANY($1::int[])
        ORDER BY t.name ASC, t.id ASC
        """,
        obligation_ids,
    )

    grouped: dict[int, list[asyncpg.Record]] = {
        obligation_id: [] for obligation_id in obligation_ids
    }
    for row in rows:
        grouped[row["obligation_id"]].append(row)
    return grouped


async def replace_obligation_tags(
    conn: asyncpg.Connection,
    *,
    obligation_id: int,
    tag_ids: list[int],
) -> None:
    """Replace tag associations for an obligation."""
    await conn.execute(
        f"""
        DELETE FROM {FINANCE_OBLIGATION_TAG_ASSIGNMENTS}
        WHERE obligation_id = $1
        """,
        obligation_id,
    )

    if not tag_ids:
        return

    await conn.executemany(
        f"""
        INSERT INTO {FINANCE_OBLIGATION_TAG_ASSIGNMENTS} (obligation_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        """,
        [(obligation_id, tag_id) for tag_id in tag_ids],
    )


async def count_owned_tags(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_ids: list[int],
) -> int:
    """Count how many obligation tag ids belong to a user."""
    if not tag_ids:
        return 0

    return await conn.fetchval(
        f"""
        SELECT COUNT(*)
        FROM {FINANCE_OBLIGATION_TAGS}
        WHERE user_id = $1 AND id = ANY($2::int[])
        """,
        user_id,
        tag_ids,
    )
