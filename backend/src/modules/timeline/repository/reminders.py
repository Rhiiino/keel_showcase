# keel_api/src/modules/timeline/repository/reminders.py

"""SQL access for timeline event notification reminders."""

from __future__ import annotations

from datetime import datetime

import asyncpg

from core.tables import TIMELINE_EVENT_REMINDERS, TIMELINE_EVENTS

_REMINDER_COLUMNS = "id, timeline_event_id, amount, unit, sent_at, created_at, updated_at"

_OFFSET_INTERVAL = """
    CASE r.unit
        WHEN 'minutes' THEN make_interval(mins => r.amount)
        WHEN 'hours' THEN make_interval(hours => r.amount)
        WHEN 'days' THEN make_interval(days => r.amount)
    END
"""



# ----- Timeline event reminders
async def list_reminders_for_event_ids(
    conn: asyncpg.Connection,
    event_ids: list[int],
) -> dict[int, list[asyncpg.Record]]:
    """Return reminder rows grouped by timeline event id."""
    if not event_ids:
        return {}

    rows = await conn.fetch(
        f"""
        SELECT {_REMINDER_COLUMNS}
        FROM {TIMELINE_EVENT_REMINDERS}
        WHERE timeline_event_id = ANY($1::int[])
        ORDER BY timeline_event_id ASC, id ASC
        """,
        event_ids,
    )
    grouped: dict[int, list[asyncpg.Record]] = {}
    for row in rows:
        grouped.setdefault(row["timeline_event_id"], []).append(row)
    return grouped


async def replace_reminders_for_event(
    conn: asyncpg.Connection,
    event_id: int,
    reminders: list[tuple[int, str]],
) -> None:
    """Replace all reminders for one timeline event."""
    await conn.execute(
        f"""
        DELETE FROM {TIMELINE_EVENT_REMINDERS}
        WHERE timeline_event_id = $1
        """,
        event_id,
    )
    if not reminders:
        return

    await conn.executemany(
        f"""
        INSERT INTO {TIMELINE_EVENT_REMINDERS} (timeline_event_id, amount, unit)
        VALUES ($1, $2, $3)
        """,
        [(event_id, amount, unit) for amount, unit in reminders],
    )


async def reset_reminder_sent_at_for_event(
    conn: asyncpg.Connection,
    event_id: int,
) -> None:
    """Clear sent_at on all reminders for an event after start_date changes."""
    await conn.execute(
        f"""
        UPDATE {TIMELINE_EVENT_REMINDERS}
        SET sent_at = NULL, updated_at = NOW()
        WHERE timeline_event_id = $1
          AND sent_at IS NOT NULL
        """,
        event_id,
    )


async def fetch_due_reminders(
    conn: asyncpg.Connection,
    *,
    as_of: datetime,
    lookback_minutes: int,
) -> list[asyncpg.Record]:
    """Return unsent reminders whose notify time falls within the lookback window."""
    return await conn.fetch(
        f"""
        SELECT
            r.id,
            r.timeline_event_id,
            r.amount,
            r.unit,
            r.sent_at,
            e.user_id,
            e.description,
            e.start_date,
            (e.start_date - {_OFFSET_INTERVAL}) AS notify_at
        FROM {TIMELINE_EVENT_REMINDERS} r
        JOIN {TIMELINE_EVENTS} e ON e.id = r.timeline_event_id
        WHERE r.sent_at IS NULL
          AND e.start_date > $1::timestamptz
          AND (e.start_date - {_OFFSET_INTERVAL}) <= $1::timestamptz
          AND (e.start_date - {_OFFSET_INTERVAL}) > ($1::timestamptz - make_interval(mins => $2))
        ORDER BY notify_at ASC, r.id ASC
        """,
        as_of,
        lookback_minutes,
    )


async def mark_reminders_sent(
    conn: asyncpg.Connection,
    reminder_ids: list[int],
    *,
    sent_at: datetime,
) -> int:
    """Mark reminders as processed. Returns the number of rows updated."""
    if not reminder_ids:
        return 0
    result = await conn.execute(
        f"""
        UPDATE {TIMELINE_EVENT_REMINDERS}
        SET sent_at = $2, updated_at = NOW()
        WHERE id = ANY($1::int[])
          AND sent_at IS NULL
        """,
        reminder_ids,
        sent_at,
    )
    return int(result.split()[-1])
