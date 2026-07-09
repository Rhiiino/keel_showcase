# keel_api/src/modules/timeline/repository/tags.py

"""SQL access for timeline tags and event-tag assignments."""

from __future__ import annotations

import asyncpg

from core.tables import (
    TIMELINE_EVENTS,
    TIMELINE_PLAN_ITEMS,
    TIMELINE_TAG_ASSIGNMENTS,
    TIMELINE_TAGS,
)

_TAG_COLUMNS = "id, user_id, name, description, color_hex, created_at, updated_at"


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
            COUNT(DISTINCT te.id)::int AS event_count,
            COUNT(DISTINCT tpi.id)::int AS plan_item_count
        FROM {TIMELINE_TAGS} t
        LEFT JOIN {TIMELINE_TAG_ASSIGNMENTS} teta ON teta.tag_id = t.id
        LEFT JOIN {TIMELINE_EVENTS} te
            ON te.id = teta.timeline_event_id
            AND te.user_id = t.user_id
        LEFT JOIN {TIMELINE_PLAN_ITEMS} tpi
            ON tpi.id = teta.timeline_plan_item_id
            AND tpi.user_id = t.user_id
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
        FROM {TIMELINE_TAGS}
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
        INSERT INTO {TIMELINE_TAGS} (user_id, name, description, color_hex)
        VALUES ($1, $2, $3, $4)
        RETURNING {_TAG_COLUMNS}
        """,
        user_id,
        name,
        description,
        color_hex,
    )
    if row is None:
        raise RuntimeError("Failed to insert timeline tag.")
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
        UPDATE {TIMELINE_TAGS}
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
        DELETE FROM {TIMELINE_TAGS}
        WHERE id = $1 AND user_id = $2
        """,
        tag_id,
        user_id,
    )
    return result.endswith("1")


async def fetch_tags_for_events(
    conn: asyncpg.Connection,
    event_ids: list[int],
) -> dict[int, list[asyncpg.Record]]:
    """Load tags grouped by timeline event id."""
    if not event_ids:
        return {}

    rows = await conn.fetch(
        f"""
        SELECT
            teta.timeline_event_id,
            t.id,
            t.name,
            t.color_hex
        FROM {TIMELINE_TAG_ASSIGNMENTS} teta
        INNER JOIN {TIMELINE_TAGS} t ON t.id = teta.tag_id
        WHERE teta.timeline_event_id = ANY($1::int[])
        ORDER BY t.name ASC, t.id ASC
        """,
        event_ids,
    )

    grouped: dict[int, list[asyncpg.Record]] = {event_id: [] for event_id in event_ids}
    for row in rows:
        grouped[row["timeline_event_id"]].append(row)
    return grouped


async def replace_event_tags(
    conn: asyncpg.Connection,
    *,
    event_id: int,
    tag_ids: list[int],
) -> None:
    """Replace tag associations for a timeline event."""
    await conn.execute(
        f"""
        DELETE FROM {TIMELINE_TAG_ASSIGNMENTS}
        WHERE timeline_event_id = $1
        """,
        event_id,
    )

    if not tag_ids:
        return

    await conn.executemany(
        f"""
        INSERT INTO {TIMELINE_TAG_ASSIGNMENTS} (timeline_event_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT (timeline_event_id, tag_id) WHERE timeline_event_id IS NOT NULL
        DO NOTHING
        """,
        [(event_id, tag_id) for tag_id in tag_ids],
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
        FROM {TIMELINE_TAGS}
        WHERE user_id = $1 AND id = ANY($2::int[])
        """,
        user_id,
        tag_ids,
    )


async def fetch_tags_for_plan_items(
    conn: asyncpg.Connection,
    plan_item_ids: list[int],
) -> dict[int, list[asyncpg.Record]]:
    """Load tags grouped by timeline plan item id."""
    if not plan_item_ids:
        return {}

    rows = await conn.fetch(
        f"""
        SELECT
            teta.timeline_plan_item_id,
            t.id,
            t.name,
            t.color_hex
        FROM {TIMELINE_TAG_ASSIGNMENTS} teta
        INNER JOIN {TIMELINE_TAGS} t ON t.id = teta.tag_id
        WHERE teta.timeline_plan_item_id = ANY($1::int[])
        ORDER BY t.name ASC, t.id ASC
        """,
        plan_item_ids,
    )

    grouped: dict[int, list[asyncpg.Record]] = {
        plan_item_id: [] for plan_item_id in plan_item_ids
    }
    for row in rows:
        grouped[row["timeline_plan_item_id"]].append(row)
    return grouped


async def replace_plan_item_tags(
    conn: asyncpg.Connection,
    *,
    plan_item_id: int,
    tag_ids: list[int],
) -> None:
    """Replace tag associations for a timeline plan item."""
    await conn.execute(
        f"""
        DELETE FROM {TIMELINE_TAG_ASSIGNMENTS}
        WHERE timeline_plan_item_id = $1
        """,
        plan_item_id,
    )

    if not tag_ids:
        return

    await conn.executemany(
        f"""
        INSERT INTO {TIMELINE_TAG_ASSIGNMENTS} (timeline_plan_item_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT (timeline_plan_item_id, tag_id)
        WHERE timeline_plan_item_id IS NOT NULL
        DO NOTHING
        """,
        [(plan_item_id, tag_id) for tag_id in tag_ids],
    )


async def copy_plan_item_tags_to_event(
    conn: asyncpg.Connection,
    *,
    plan_item_id: int,
    event_id: int,
) -> None:
    """Copy tag assignments from a plan item to a timeline event (promote flow)."""
    await conn.execute(
        f"""
        INSERT INTO {TIMELINE_TAG_ASSIGNMENTS} (timeline_event_id, tag_id)
        SELECT $2, tag_id
        FROM {TIMELINE_TAG_ASSIGNMENTS}
        WHERE timeline_plan_item_id = $1
        ON CONFLICT (timeline_event_id, tag_id)
        WHERE timeline_event_id IS NOT NULL
        DO NOTHING
        """,
        plan_item_id,
        event_id,
    )
