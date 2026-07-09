# keel_api/src/modules/finance/transaction_tag_repository.py

"""SQL access for finance transaction tags and tag assignments."""

from __future__ import annotations

import asyncpg

from core.tables import (
    FINANCE_TRANSACTIONS,
    FINANCE_TRANSACTION_TAG_ASSIGNMENTS,
    FINANCE_TRANSACTION_TAGS,
)

_TAG_COLUMNS = "id, user_id, name, description, color_hex, created_at, updated_at"



# ----- Transaction tags table operations
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
            t.description,
            t.color_hex,
            t.created_at,
            t.updated_at,
            COUNT(DISTINCT tx.id)::int AS transaction_count
        FROM {FINANCE_TRANSACTION_TAGS} t
        LEFT JOIN {FINANCE_TRANSACTION_TAG_ASSIGNMENTS} tta ON tta.tag_id = t.id
        LEFT JOIN {FINANCE_TRANSACTIONS} tx
            ON tx.id = tta.transaction_id
            AND tx.user_id = t.user_id
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
    """Fetch one tag row owned by a user."""
    return await conn.fetchrow(
        f"""
        SELECT {_TAG_COLUMNS}
        FROM {FINANCE_TRANSACTION_TAGS}
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
    """Insert a new user tag row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {FINANCE_TRANSACTION_TAGS} (user_id, name, description, color_hex)
        VALUES ($1, $2, $3, $4)
        RETURNING {_TAG_COLUMNS}
        """,
        user_id,
        name,
        description,
        color_hex,
    )
    if row is None:
        raise RuntimeError("Failed to insert finance transaction tag.")
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
    """Update one user tag row."""
    return await conn.fetchrow(
        f"""
        UPDATE {FINANCE_TRANSACTION_TAGS}
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
    """Delete one user tag row."""
    result = await conn.execute(
        f"""
        DELETE FROM {FINANCE_TRANSACTION_TAGS}
        WHERE id = $1 AND user_id = $2
        """,
        tag_id,
        user_id,
    )
    return result.endswith("1")


async def fetch_tags_for_transactions(
    conn: asyncpg.Connection,
    transaction_ids: list[int],
) -> dict[int, list[asyncpg.Record]]:
    """Load tags grouped by transaction id."""
    if not transaction_ids:
        return {}

    rows = await conn.fetch(
        f"""
        SELECT
            tta.transaction_id,
            t.id,
            t.name,
            t.description,
            t.color_hex
        FROM {FINANCE_TRANSACTION_TAG_ASSIGNMENTS} tta
        INNER JOIN {FINANCE_TRANSACTION_TAGS} t ON t.id = tta.tag_id
        WHERE tta.transaction_id = ANY($1::int[])
        ORDER BY t.name ASC, t.id ASC
        """,
        transaction_ids,
    )

    grouped: dict[int, list[asyncpg.Record]] = {
        transaction_id: [] for transaction_id in transaction_ids
    }
    for row in rows:
        grouped[row["transaction_id"]].append(row)
    return grouped


async def replace_transaction_tags(
    conn: asyncpg.Connection,
    *,
    transaction_id: int,
    tag_ids: list[int],
) -> None:
    """Replace tag associations for a transaction."""
    await conn.execute(
        f"""
        DELETE FROM {FINANCE_TRANSACTION_TAG_ASSIGNMENTS}
        WHERE transaction_id = $1
        """,
        transaction_id,
    )

    if not tag_ids:
        return

    await conn.executemany(
        f"""
        INSERT INTO {FINANCE_TRANSACTION_TAG_ASSIGNMENTS} (transaction_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        """,
        [(transaction_id, tag_id) for tag_id in tag_ids],
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
        FROM {FINANCE_TRANSACTION_TAGS}
        WHERE user_id = $1 AND id = ANY($2::int[])
        """,
        user_id,
        tag_ids,
    )
