# keel_api/src/modules/coak/repository/tags.py

"""SQL access for coak tags and item-tag assignments."""

from __future__ import annotations

import asyncpg

from core.tables import COAK_ITEM_TAG_ASSIGNMENTS, COAK_ITEMS, COAK_TAGS

_TAG_COLUMNS = "id, coak_record_id, user_id, name, description, color_hex, created_at, updated_at"



# ----- Coak tags table operations
async def list_record_tags(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
) -> list[asyncpg.Record]:
    """List tag rows for a coak record with item counts."""
    return await conn.fetch(
        f"""
        SELECT
            t.id,
            t.coak_record_id,
            t.user_id,
            t.name,
            t.description,
            t.color_hex,
            t.created_at,
            t.updated_at,
            COUNT(DISTINCT cita.coak_item_id)::int AS item_count
        FROM {COAK_TAGS} t
        LEFT JOIN {COAK_ITEM_TAG_ASSIGNMENTS} cita
            ON cita.tag_id = t.id
            AND cita.coak_record_id = t.coak_record_id
        LEFT JOIN {COAK_ITEMS} ci
            ON ci.id = cita.coak_item_id
            AND ci.coak_record_id = t.coak_record_id
            AND ci.user_id = t.user_id
        WHERE t.user_id = $1 AND t.coak_record_id = $2
        GROUP BY
            t.id,
            t.coak_record_id,
            t.user_id,
            t.name,
            t.description,
            t.color_hex,
            t.created_at,
            t.updated_at
        ORDER BY t.name ASC, t.id ASC
        """,
        user_id,
        record_id,
    )


async def get_record_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
    tag_id: int,
) -> asyncpg.Record | None:
    """Fetch one tag row owned by a user within a record."""
    return await conn.fetchrow(
        f"""
        SELECT {_TAG_COLUMNS}
        FROM {COAK_TAGS}
        WHERE id = $1 AND user_id = $2 AND coak_record_id = $3
        """,
        tag_id,
        user_id,
        record_id,
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
        FROM {COAK_TAGS}
        WHERE id = $1 AND user_id = $2
        """,
        tag_id,
        user_id,
    )


async def insert_record_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
    name: str,
    description: str | None,
    color_hex: str,
) -> asyncpg.Record:
    """Insert a new tag row for a coak record."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {COAK_TAGS} (coak_record_id, user_id, name, description, color_hex)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING {_TAG_COLUMNS}
        """,
        record_id,
        user_id,
        name,
        description,
        color_hex,
    )
    if row is None:
        raise RuntimeError("Failed to insert coak tag.")
    return row


async def update_record_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
    tag_id: int,
    name: str,
    description: str | None,
    color_hex: str,
) -> asyncpg.Record | None:
    """Update one tag row for a coak record."""
    return await conn.fetchrow(
        f"""
        UPDATE {COAK_TAGS}
        SET
            name = $4,
            description = $5,
            color_hex = $6,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND coak_record_id = $3
        RETURNING {_TAG_COLUMNS}
        """,
        tag_id,
        user_id,
        record_id,
        name,
        description,
        color_hex,
    )


async def delete_record_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
    tag_id: int,
) -> bool:
    """Delete one tag row for a coak record."""
    result = await conn.execute(
        f"""
        DELETE FROM {COAK_TAGS}
        WHERE id = $1 AND user_id = $2 AND coak_record_id = $3
        """,
        tag_id,
        user_id,
        record_id,
    )
    return result.endswith("1")



# ----- Coak item tag assignments
async def fetch_tags_for_items(
    conn: asyncpg.Connection,
    item_ids: list[int],
) -> dict[int, list[asyncpg.Record]]:
    """Load tags grouped by coak item id."""
    if not item_ids:
        return {}

    rows = await conn.fetch(
        f"""
        SELECT
            cita.coak_item_id,
            t.id,
            t.name,
            t.color_hex
        FROM {COAK_ITEM_TAG_ASSIGNMENTS} cita
        INNER JOIN {COAK_TAGS} t ON t.id = cita.tag_id
        WHERE cita.coak_item_id = ANY($1::int[])
        ORDER BY t.name ASC, t.id ASC
        """,
        item_ids,
    )

    grouped: dict[int, list[asyncpg.Record]] = {item_id: [] for item_id in item_ids}
    for row in rows:
        grouped[row["coak_item_id"]].append(row)
    return grouped


async def replace_item_tags(
    conn: asyncpg.Connection,
    *,
    item_id: int,
    record_id: int,
    tag_ids: list[int],
) -> None:
    """Replace tag associations for a coak item."""
    await conn.execute(
        f"""
        DELETE FROM {COAK_ITEM_TAG_ASSIGNMENTS}
        WHERE coak_item_id = $1
        """,
        item_id,
    )

    if not tag_ids:
        return

    await conn.executemany(
        f"""
        INSERT INTO {COAK_ITEM_TAG_ASSIGNMENTS} (coak_item_id, coak_record_id, tag_id)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
        """,
        [(item_id, record_id, tag_id) for tag_id in tag_ids],
    )


async def count_owned_tags(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
    tag_ids: list[int],
) -> int:
    """Count how many tag ids belong to a user within a record."""
    if not tag_ids:
        return 0

    return await conn.fetchval(
        f"""
        SELECT COUNT(*)
        FROM {COAK_TAGS}
        WHERE user_id = $1 AND coak_record_id = $2 AND id = ANY($3::int[])
        """,
        user_id,
        record_id,
        tag_ids,
    )
