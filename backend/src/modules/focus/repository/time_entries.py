# keel_api/src/modules/focus/repository/time_entries.py

"""SQL access for focus node time entries."""

from __future__ import annotations

import asyncpg

from core.tables import FOCUS_NODE_TIME_ENTRIES

_TIME_ENTRY_COLUMNS = (
    "id, user_id, node_id, status, started_at, last_paused_at, ended_at, "
    "accumulated_paused_seconds, duration_seconds, created_at, updated_at"
)



# ----- Focus node time entries
async def list_node_time_entries(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    node_id: int,
) -> list[asyncpg.Record]:
    """List timer session rows for one owned focus node."""
    return await conn.fetch(
        f"""
        SELECT {_TIME_ENTRY_COLUMNS}
        FROM {FOCUS_NODE_TIME_ENTRIES}
        WHERE user_id = $1 AND node_id = $2
        ORDER BY started_at DESC, id DESC
        """,
        user_id,
        node_id,
    )


async def get_open_time_entry(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    node_id: int,
) -> asyncpg.Record | None:
    """Fetch the active or paused timer row for one focus node."""
    return await conn.fetchrow(
        f"""
        SELECT {_TIME_ENTRY_COLUMNS}
        FROM {FOCUS_NODE_TIME_ENTRIES}
        WHERE user_id = $1
          AND node_id = $2
          AND status IN ('running', 'paused')
        ORDER BY started_at DESC, id DESC
        LIMIT 1
        """,
        user_id,
        node_id,
    )


async def insert_running_time_entry(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    node_id: int,
) -> asyncpg.Record:
    """Create a new running timer row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {FOCUS_NODE_TIME_ENTRIES} (user_id, node_id, status)
        VALUES ($1, $2, 'running')
        RETURNING {_TIME_ENTRY_COLUMNS}
        """,
        user_id,
        node_id,
    )
    if row is None:
        raise RuntimeError("Failed to insert focus node time entry.")
    return row


async def pause_time_entry(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    node_id: int,
) -> asyncpg.Record | None:
    """Pause the running timer row for one focus node."""
    return await conn.fetchrow(
        f"""
        UPDATE {FOCUS_NODE_TIME_ENTRIES}
        SET
            status = 'paused',
            last_paused_at = NOW(),
            updated_at = NOW()
        WHERE user_id = $1
          AND node_id = $2
          AND status = 'running'
        RETURNING {_TIME_ENTRY_COLUMNS}
        """,
        user_id,
        node_id,
    )


async def resume_time_entry(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    node_id: int,
) -> asyncpg.Record | None:
    """Resume the paused timer row for one focus node."""
    return await conn.fetchrow(
        f"""
        UPDATE {FOCUS_NODE_TIME_ENTRIES}
        SET
            status = 'running',
            accumulated_paused_seconds = accumulated_paused_seconds
                + GREATEST(
                    FLOOR(EXTRACT(EPOCH FROM (NOW() - last_paused_at)))::int,
                    0
                ),
            last_paused_at = NULL,
            updated_at = NOW()
        WHERE user_id = $1
          AND node_id = $2
          AND status = 'paused'
          AND last_paused_at IS NOT NULL
        RETURNING {_TIME_ENTRY_COLUMNS}
        """,
        user_id,
        node_id,
    )


async def end_time_entry(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    node_id: int,
) -> asyncpg.Record | None:
    """End the open timer row for one focus node."""
    return await conn.fetchrow(
        f"""
        UPDATE {FOCUS_NODE_TIME_ENTRIES}
        SET
            status = 'ended',
            ended_at = NOW(),
            duration_seconds = GREATEST(
                FLOOR(
                    EXTRACT(EPOCH FROM (NOW() - started_at))
                    - accumulated_paused_seconds
                    - CASE
                        WHEN status = 'paused' AND last_paused_at IS NOT NULL
                        THEN EXTRACT(EPOCH FROM (NOW() - last_paused_at))
                        ELSE 0
                      END
                )::int,
                0
            ),
            updated_at = NOW()
        WHERE user_id = $1
          AND node_id = $2
          AND status IN ('running', 'paused')
        RETURNING {_TIME_ENTRY_COLUMNS}
        """,
        user_id,
        node_id,
    )
