# keel_api/src/modules/timeline/repository/plans.py

"""SQL access for timeline plans and plan items."""

from __future__ import annotations

from datetime import date, datetime

import asyncpg

from core.tables import (
    TIMELINE_PLAN_ITEMS,
    TIMELINE_PLANS,
)

_PLAN_COLUMNS = (
    "id, user_id, title, start_date, end_date, notes, created_at, updated_at"
)

_PLAN_ITEM_COLUMNS = (
    "id, user_id, plan_id, title, description, start_at, end_at, all_day, "
    "sort_order, status, timeline_event_id, created_at, updated_at"
)



# ----- Timeline plans table operations
async def list_plans(
    conn: asyncpg.Connection,
    user_id: int,
    *,
    start_date_from: date | None = None,
    start_date_to: date | None = None,
) -> list[asyncpg.Record]:
    conditions = ["p.user_id = $1"]
    params: list[object] = [user_id]
    param_index = 2

    if start_date_from is not None:
        conditions.append(f"p.end_date >= ${param_index}")
        params.append(start_date_from)
        param_index += 1

    if start_date_to is not None:
        conditions.append(f"p.start_date <= ${param_index}")
        params.append(start_date_to)
        param_index += 1

    where_clause = " AND ".join(conditions)
    return await conn.fetch(
        f"""
        SELECT
            p.id,
            p.user_id,
            p.title,
            p.start_date,
            p.end_date,
            p.notes,
            p.created_at,
            p.updated_at,
            COALESCE(item_counts.item_count, 0)::int AS item_count
        FROM {TIMELINE_PLANS} p
        LEFT JOIN (
            SELECT plan_id, COUNT(*)::int AS item_count
            FROM {TIMELINE_PLAN_ITEMS}
            GROUP BY plan_id
        ) item_counts ON item_counts.plan_id = p.id
        WHERE {where_clause}
        ORDER BY p.start_date DESC, p.id DESC
        """,
        *params,
    )


async def get_plan(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    plan_id: int,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        SELECT {_PLAN_COLUMNS}
        FROM {TIMELINE_PLANS}
        WHERE id = $1 AND user_id = $2
        """,
        plan_id,
        user_id,
    )


async def insert_plan(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    title: str,
    start_date: date,
    end_date: date,
    notes: str,
) -> asyncpg.Record:
    row = await conn.fetchrow(
        f"""
        INSERT INTO {TIMELINE_PLANS} (user_id, title, start_date, end_date, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING {_PLAN_COLUMNS}
        """,
        user_id,
        title,
        start_date,
        end_date,
        notes,
    )
    if row is None:
        raise RuntimeError("Failed to insert timeline plan.")
    return row


async def update_plan(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    plan_id: int,
    title: str,
    start_date: date,
    end_date: date,
    notes: str,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        UPDATE {TIMELINE_PLANS}
        SET
            title = $3,
            start_date = $4,
            end_date = $5,
            notes = $6,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING {_PLAN_COLUMNS}
        """,
        plan_id,
        user_id,
        title,
        start_date,
        end_date,
        notes,
    )


async def delete_plan(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    plan_id: int,
) -> bool:
    result = await conn.execute(
        f"""
        DELETE FROM {TIMELINE_PLANS}
        WHERE id = $1 AND user_id = $2
        """,
        plan_id,
        user_id,
    )
    return result.endswith("1")



# ----- Timeline plan items table operations
async def list_plan_items_for_plan(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    plan_id: int,
) -> list[asyncpg.Record]:
    return await conn.fetch(
        f"""
        SELECT {_PLAN_ITEM_COLUMNS}
        FROM {TIMELINE_PLAN_ITEMS}
        WHERE user_id = $1 AND plan_id = $2
        ORDER BY sort_order ASC, id ASC
        """,
        user_id,
        plan_id,
    )


async def list_plan_items_in_range(
    conn: asyncpg.Connection,
    user_id: int,
    *,
    start_at_from: datetime,
    start_at_to: datetime,
) -> list[asyncpg.Record]:
    return await conn.fetch(
        f"""
        SELECT {_PLAN_ITEM_COLUMNS}
        FROM {TIMELINE_PLAN_ITEMS}
        WHERE user_id = $1
          AND start_at <= $3
          AND COALESCE(end_at, start_at) >= $2
        ORDER BY start_at ASC, sort_order ASC, id ASC
        """,
        user_id,
        start_at_from,
        start_at_to,
    )


async def get_plan_item(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    item_id: int,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        SELECT {_PLAN_ITEM_COLUMNS}
        FROM {TIMELINE_PLAN_ITEMS}
        WHERE id = $1 AND user_id = $2
        """,
        item_id,
        user_id,
    )


async def insert_plan_item(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    plan_id: int,
    title: str,
    description: str,
    start_at: datetime,
    end_at: datetime | None,
    all_day: bool,
    sort_order: int,
    status: str,
    timeline_event_id: int | None = None,
) -> asyncpg.Record:
    row = await conn.fetchrow(
        f"""
        INSERT INTO {TIMELINE_PLAN_ITEMS} (
            user_id,
            plan_id,
            title,
            description,
            start_at,
            end_at,
            all_day,
            sort_order,
            status,
            timeline_event_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING {_PLAN_ITEM_COLUMNS}
        """,
        user_id,
        plan_id,
        title,
        description,
        start_at,
        end_at,
        all_day,
        sort_order,
        status,
        timeline_event_id,
    )
    if row is None:
        raise RuntimeError("Failed to insert timeline plan item.")
    return row


async def update_plan_item(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    item_id: int,
    title: str,
    description: str,
    start_at: datetime,
    end_at: datetime | None,
    all_day: bool,
    sort_order: int,
    status: str,
    timeline_event_id: int | None,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        UPDATE {TIMELINE_PLAN_ITEMS}
        SET
            title = $3,
            description = $4,
            start_at = $5,
            end_at = $6,
            all_day = $7,
            sort_order = $8,
            status = $9,
            timeline_event_id = $10,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING {_PLAN_ITEM_COLUMNS}
        """,
        item_id,
        user_id,
        title,
        description,
        start_at,
        end_at,
        all_day,
        sort_order,
        status,
        timeline_event_id,
    )


async def delete_plan_item(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    item_id: int,
) -> bool:
    result = await conn.execute(
        f"""
        DELETE FROM {TIMELINE_PLAN_ITEMS}
        WHERE id = $1 AND user_id = $2
        """,
        item_id,
        user_id,
    )
    return result.endswith("1")


async def max_sort_order_for_plan(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    plan_id: int,
) -> int:
    value = await conn.fetchval(
        f"""
        SELECT COALESCE(MAX(sort_order), -1)
        FROM {TIMELINE_PLAN_ITEMS}
        WHERE user_id = $1 AND plan_id = $2
        """,
        user_id,
        plan_id,
    )
    return int(value or -1)


async def update_plan_item_sort_orders(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    plan_id: int,
    sort_orders_by_item_id: dict[int, int],
) -> None:
    for item_id, sort_order in sort_orders_by_item_id.items():
        await conn.execute(
            f"""
            UPDATE {TIMELINE_PLAN_ITEMS}
            SET sort_order = $4, updated_at = NOW()
            WHERE id = $1 AND user_id = $2 AND plan_id = $3
            """,
            item_id,
            user_id,
            plan_id,
            sort_order,
        )
