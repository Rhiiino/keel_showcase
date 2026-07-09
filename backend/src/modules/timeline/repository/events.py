# keel_api/src/modules/timeline/repository/events.py

"""SQL access for timeline events and contact tagging."""

from __future__ import annotations

from datetime import date, datetime

import asyncpg

from core.tables import (
    CONTACTS,
    FIGURES,
    TIMELINE_EVENT_CONTACTS,
    TIMELINE_EVENT_FIGURES,
    TIMELINE_TAG_ASSIGNMENTS,
    TIMELINE_EVENTS,
)

_EVENT_COLUMNS = (
    "e.id, e.user_id, e.subject_name, e.description, e.start_date, e.end_date, e.all_day, "
    "e.created_at, e.updated_at"
)

_EVENT_RETURNING = (
    "id, user_id, subject_name, description, start_date, end_date, all_day, created_at, updated_at"
)

_CONTACT_DISPLAY_NAME = (
    "COALESCE("
    "NULLIF(trim(concat_ws(' ', c.first_name, c.last_name)), ''), "
    "'Unnamed contact'"
    ")"
)

_FIGURE_DISPLAY_NAME = (
    "COALESCE("
    "NULLIF(trim(concat_ws(' ', f.first_name, f.last_name)), ''), "
    "'Unnamed figure'"
    ")"
)



# ----- Timeline events table operations
async def list_events(
    conn: asyncpg.Connection,
    user_id: int,
    *,
    contact_id: int | None = None,
    contact_ids: list[int] | None = None,
    figure_id: int | None = None,
    figure_ids: list[int] | None = None,
    query: str | None = None,
    subject_name: str | None = None,
    start_date_from: date | None = None,
    start_date_to: date | None = None,
    tag_ids: list[int] | None = None,
) -> list[asyncpg.Record]:
    """List timeline event rows for a user with optional filters."""
    conditions = ["e.user_id = $1"]
    params: list[object] = [user_id]
    param_index = 2

    if contact_ids:
        conditions.append(
            f"""
            EXISTS (
                SELECT 1
                FROM {TIMELINE_EVENT_CONTACTS} tec_filter
                WHERE tec_filter.timeline_event_id = e.id
                  AND tec_filter.contact_id = ANY(${param_index}::int[])
            )
            """
        )
        params.append(contact_ids)
        param_index += 1
    elif contact_id is not None:
        conditions.append(
            f"""
            EXISTS (
                SELECT 1
                FROM {TIMELINE_EVENT_CONTACTS} tec_filter
                WHERE tec_filter.timeline_event_id = e.id
                  AND tec_filter.contact_id = ${param_index}
            )
            """
        )
        params.append(contact_id)
        param_index += 1

    if figure_ids:
        conditions.append(
            f"""
            EXISTS (
                SELECT 1
                FROM {TIMELINE_EVENT_FIGURES} tef_filter
                WHERE tef_filter.timeline_event_id = e.id
                  AND tef_filter.figure_id = ANY(${param_index}::int[])
            )
            """
        )
        params.append(figure_ids)
        param_index += 1
    elif figure_id is not None:
        conditions.append(
            f"""
            EXISTS (
                SELECT 1
                FROM {TIMELINE_EVENT_FIGURES} tef_filter
                WHERE tef_filter.timeline_event_id = e.id
                  AND tef_filter.figure_id = ${param_index}
            )
            """
        )
        params.append(figure_id)
        param_index += 1

    if subject_name and subject_name.strip():
        pattern = f"%{subject_name.strip()}%"
        conditions.append(f"COALESCE(e.subject_name, '') ILIKE ${param_index}")
        params.append(pattern)
        param_index += 1

    if query and query.strip():
        pattern = f"%{query.strip()}%"
        conditions.append(
            f"""(
                e.description ILIKE ${param_index}
                OR COALESCE(e.subject_name, '') ILIKE ${param_index}
                OR EXISTS (
                    SELECT 1
                    FROM {TIMELINE_EVENT_CONTACTS} tec_search
                    JOIN {CONTACTS} c_search ON c_search.id = tec_search.contact_id
                    WHERE tec_search.timeline_event_id = e.id
                      AND (
                          COALESCE(c_search.first_name, '') ILIKE ${param_index}
                          OR COALESCE(c_search.last_name, '') ILIKE ${param_index}
                          OR trim(concat_ws(' ', c_search.first_name, c_search.last_name)) ILIKE ${param_index}
                      )
                )
                OR EXISTS (
                    SELECT 1
                    FROM {TIMELINE_EVENT_FIGURES} tef_search
                    JOIN {FIGURES} f_search ON f_search.id = tef_search.figure_id
                    WHERE tef_search.timeline_event_id = e.id
                      AND (
                          COALESCE(f_search.first_name, '') ILIKE ${param_index}
                          OR COALESCE(f_search.last_name, '') ILIKE ${param_index}
                          OR trim(concat_ws(' ', f_search.first_name, f_search.last_name)) ILIKE ${param_index}
                      )
                )
            )"""
        )
        params.append(pattern)
        param_index += 1

    if start_date_to is not None:
        conditions.append(f"e.start_date::date <= ${param_index}")
        params.append(start_date_to)
        param_index += 1

    if start_date_from is not None:
        conditions.append(f"COALESCE(e.end_date, e.start_date)::date >= ${param_index}")
        params.append(start_date_from)
        param_index += 1

    if tag_ids:
        conditions.append(
            f"""
            EXISTS (
                SELECT 1
                FROM {TIMELINE_TAG_ASSIGNMENTS} teta_filter
                WHERE teta_filter.timeline_event_id = e.id
                  AND teta_filter.tag_id = ANY(${param_index}::int[])
            )
            """
        )
        params.append(tag_ids)
        param_index += 1

    where_clause = " AND ".join(conditions)
    return await conn.fetch(
        f"""
        SELECT {_EVENT_COLUMNS}
        FROM {TIMELINE_EVENTS} e
        WHERE {where_clause}
        ORDER BY e.start_date DESC, e.id DESC
        """,
        *params,
    )


async def get_event(
    conn: asyncpg.Connection,
    event_id: int,
) -> asyncpg.Record | None:
    """Fetch one timeline event row by id."""
    return await conn.fetchrow(
        f"""
        SELECT {_EVENT_COLUMNS}
        FROM {TIMELINE_EVENTS} e
        WHERE e.id = $1
        """,
        event_id,
    )


async def insert_event(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    subject_name: str | None,
    description: str,
    start_date: datetime,
    end_date: datetime | None,
    all_day: bool = False,
) -> asyncpg.Record:
    """Insert a timeline event row."""
    return await conn.fetchrow(
        f"""
        INSERT INTO {TIMELINE_EVENTS} (
            user_id,
            subject_name,
            description,
            start_date,
            end_date,
            all_day
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING {_EVENT_RETURNING}
        """,
        user_id,
        subject_name,
        description,
        start_date,
        end_date,
        all_day,
    )


async def update_event(
    conn: asyncpg.Connection,
    event_id: int,
    *,
    subject_name: str | None,
    description: str,
    start_date: datetime,
    end_date: datetime | None,
    all_day: bool,
) -> asyncpg.Record | None:
    """Update one timeline event row."""
    return await conn.fetchrow(
        f"""
        UPDATE {TIMELINE_EVENTS}
        SET
            subject_name = $2,
            description = $3,
            start_date = $4,
            end_date = $5,
            all_day = $6,
            updated_at = NOW()
        WHERE id = $1
        RETURNING {_EVENT_RETURNING}
        """,
        event_id,
        subject_name,
        description,
        start_date,
        end_date,
        all_day,
    )


async def delete_event(
    conn: asyncpg.Connection,
    event_id: int,
) -> str | None:
    """Delete one timeline event row. Returns deleted id as string or None."""
    return await conn.fetchval(
        f"""
        DELETE FROM {TIMELINE_EVENTS}
        WHERE id = $1
        RETURNING id::text
        """,
        event_id,
    )



# ----- Timeline event contacts junction
async def list_contacts_for_events(
    conn: asyncpg.Connection,
    event_ids: list[int],
) -> dict[int, list[asyncpg.Record]]:
    """Return contact rows grouped by timeline event id."""
    if not event_ids:
        return {}

    rows = await conn.fetch(
        f"""
        SELECT
            tec.timeline_event_id,
            c.id,
            {_CONTACT_DISPLAY_NAME} AS display_name
        FROM {TIMELINE_EVENT_CONTACTS} tec
        JOIN {CONTACTS} c ON c.id = tec.contact_id
        WHERE tec.timeline_event_id = ANY($1::int[])
        ORDER BY tec.timeline_event_id ASC, c.id ASC
        """,
        event_ids,
    )

    grouped: dict[int, list[asyncpg.Record]] = {}
    for row in rows:
        grouped.setdefault(row["timeline_event_id"], []).append(row)
    return grouped


async def replace_event_contacts(
    conn: asyncpg.Connection,
    event_id: int,
    contact_ids: list[int],
) -> None:
    """Replace all contact links for one timeline event."""
    await conn.execute(
        f"""
        DELETE FROM {TIMELINE_EVENT_CONTACTS}
        WHERE timeline_event_id = $1
        """,
        event_id,
    )

    if not contact_ids:
        return

    await conn.executemany(
        f"""
        INSERT INTO {TIMELINE_EVENT_CONTACTS} (timeline_event_id, contact_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        """,
        [(event_id, contact_id) for contact_id in contact_ids],
    )


async def contact_exists(
    conn: asyncpg.Connection,
    user_id: int,
    contact_id: int,
) -> bool:
    """Return True when a contact row exists for the user."""
    value = await conn.fetchval(
        f"SELECT 1 FROM {CONTACTS} WHERE id = $1 AND user_id = $2",
        contact_id,
        user_id,
    )
    return value is not None



# ----- Timeline event figures junction
async def list_figures_for_events(
    conn: asyncpg.Connection,
    event_ids: list[int],
) -> dict[int, list[asyncpg.Record]]:
    """Return figure rows grouped by timeline event id."""
    if not event_ids:
        return {}

    rows = await conn.fetch(
        f"""
        SELECT
            tef.timeline_event_id,
            f.id,
            {_FIGURE_DISPLAY_NAME} AS display_name
        FROM {TIMELINE_EVENT_FIGURES} tef
        JOIN {FIGURES} f ON f.id = tef.figure_id
        WHERE tef.timeline_event_id = ANY($1::int[])
        ORDER BY tef.timeline_event_id ASC, f.id ASC
        """,
        event_ids,
    )

    grouped: dict[int, list[asyncpg.Record]] = {}
    for row in rows:
        grouped.setdefault(row["timeline_event_id"], []).append(row)
    return grouped


async def replace_event_figures(
    conn: asyncpg.Connection,
    event_id: int,
    figure_ids: list[int],
) -> None:
    """Replace all figure links for one timeline event."""
    await conn.execute(
        f"""
        DELETE FROM {TIMELINE_EVENT_FIGURES}
        WHERE timeline_event_id = $1
        """,
        event_id,
    )

    if not figure_ids:
        return

    await conn.executemany(
        f"""
        INSERT INTO {TIMELINE_EVENT_FIGURES} (timeline_event_id, figure_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        """,
        [(event_id, figure_id) for figure_id in figure_ids],
    )


async def figure_exists(
    conn: asyncpg.Connection,
    user_id: int,
    figure_id: int,
) -> bool:
    """Return True when a figure row exists for the user."""
    value = await conn.fetchval(
        f"SELECT 1 FROM {FIGURES} WHERE id = $1 AND user_id = $2",
        figure_id,
        user_id,
    )
    return value is not None
