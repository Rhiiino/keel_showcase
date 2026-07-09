# keel_api/src/modules/coak/repository/items.py

"""SQL access for coak_items."""

from __future__ import annotations

from uuid import UUID

import asyncpg

from core.tables import COAK_ITEMS

_ITEM_COLUMNS = (
    "id, coak_record_id, user_id, parent_id, kind, name, color_hex, "
    "sort_order, media_id, note_body, flash_front, flash_back, created_at, updated_at"
)



async def list_items_for_record(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
) -> list[asyncpg.Record]:
    return await conn.fetch(
        f"""
        SELECT {_ITEM_COLUMNS}
        FROM {COAK_ITEMS}
        WHERE user_id = $1 AND coak_record_id = $2
        ORDER BY parent_id NULLS FIRST, sort_order ASC, id ASC
        """,
        user_id,
        record_id,
    )


async def get_item(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
    item_id: int,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        SELECT {_ITEM_COLUMNS}
        FROM {COAK_ITEMS}
        WHERE user_id = $1 AND coak_record_id = $2 AND id = $3
        """,
        user_id,
        record_id,
        item_id,
    )


async def next_sort_order(
    conn: asyncpg.Connection,
    *,
    record_id: int,
    parent_id: int | None,
) -> int:
    row = await conn.fetchrow(
        f"""
        SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
        FROM {COAK_ITEMS}
        WHERE coak_record_id = $1
          AND parent_id IS NOT DISTINCT FROM $2
        """,
        record_id,
        parent_id,
    )
    return int(row["next_order"]) if row else 0


async def insert_item(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
    parent_id: int | None,
    kind: str,
    name: str,
    color_hex: str,
    sort_order: int,
    media_id: UUID | None,
    note_body: str,
    flash_front: str,
    flash_back: str,
) -> asyncpg.Record:
    return await conn.fetchrow(
        f"""
        INSERT INTO {COAK_ITEMS} (
            coak_record_id,
            user_id,
            parent_id,
            kind,
            name,
            color_hex,
            sort_order,
            media_id,
            note_body,
            flash_front,
            flash_back
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING {_ITEM_COLUMNS}
        """,
        record_id,
        user_id,
        parent_id,
        kind,
        name,
        color_hex,
        sort_order,
        media_id,
        note_body,
        flash_front,
        flash_back,
    )


async def update_item(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
    item_id: int,
    kind: str | None,
    kind_provided: bool,
    name: str | None,
    parent_id: int | None,
    parent_id_provided: bool,
    color_hex: str | None,
    sort_order: int | None,
    media_id: UUID | None,
    media_id_provided: bool,
    note_body: str | None,
    flash_front: str | None,
    flash_back: str | None,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        UPDATE {COAK_ITEMS}
        SET
            kind = CASE WHEN $4 THEN $5 ELSE kind END,
            name = COALESCE($6, name),
            parent_id = CASE WHEN $7 THEN $8 ELSE parent_id END,
            color_hex = COALESCE($9, color_hex),
            sort_order = COALESCE($10, sort_order),
            media_id = CASE WHEN $11 THEN $12 ELSE media_id END,
            note_body = COALESCE($13, note_body),
            flash_front = COALESCE($14, flash_front),
            flash_back = COALESCE($15, flash_back),
            updated_at = NOW()
        WHERE user_id = $1 AND coak_record_id = $2 AND id = $3
        RETURNING {_ITEM_COLUMNS}
        """,
        user_id,
        record_id,
        item_id,
        kind_provided,
        kind,
        name,
        parent_id_provided,
        parent_id,
        color_hex,
        sort_order,
        media_id_provided,
        media_id,
        note_body,
        flash_front,
        flash_back,
    )


async def delete_item(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
    item_id: int,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        DELETE FROM {COAK_ITEMS}
        WHERE user_id = $1 AND coak_record_id = $2 AND id = $3
        RETURNING {_ITEM_COLUMNS}
        """,
        user_id,
        record_id,
        item_id,
    )


async def list_descendant_ids(
    conn: asyncpg.Connection,
    *,
    record_id: int,
    item_id: int,
) -> list[int]:
    rows = await conn.fetch(
        f"""
        WITH RECURSIVE descendants AS (
            SELECT id
            FROM {COAK_ITEMS}
            WHERE coak_record_id = $1 AND id = $2
            UNION ALL
            SELECT child.id
            FROM {COAK_ITEMS} child
            INNER JOIN descendants parent ON child.parent_id = parent.id
            WHERE child.coak_record_id = $1
        )
        SELECT id FROM descendants
        """,
        record_id,
        item_id,
    )
    return [int(row["id"]) for row in rows]
