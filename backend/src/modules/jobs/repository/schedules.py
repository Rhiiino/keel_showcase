# keel_api/src/modules/jobs/repository/schedules.py
"""SQL access for configurable job schedules."""

from __future__ import annotations

import json
from typing import Any
from uuid import UUID

import asyncpg

from core.tables import JOB_SCHEDULES

_SCHEDULE_COLUMNS = """
    id,
    name,
    task_name,
    enabled,
    queue,
    recurrence,
    minute,
    hour,
    days_of_week,
    day_of_month,
    month_of_year,
    interval_minutes,
    timezone,
    task_kwargs,
    created_at,
    updated_at
"""



# ----- Job schedules
async def list_enabled_job_schedules(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    """Return enabled schedules for Celery Beat sync."""
    return await conn.fetch(
        f"""
        SELECT {_SCHEDULE_COLUMNS}
        FROM {JOB_SCHEDULES}
        WHERE enabled = TRUE
        ORDER BY name ASC
        """
    )


async def list_job_schedules(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    """Return all schedules ordered by name."""
    return await conn.fetch(
        f"""
        SELECT {_SCHEDULE_COLUMNS}
        FROM {JOB_SCHEDULES}
        ORDER BY name ASC
        """
    )


async def get_job_schedule_by_id(
    conn: asyncpg.Connection,
    *,
    schedule_id: UUID,
) -> asyncpg.Record | None:
    """Fetch one schedule by primary key."""
    return await conn.fetchrow(
        f"""
        SELECT {_SCHEDULE_COLUMNS}
        FROM {JOB_SCHEDULES}
        WHERE id = $1
        """,
        schedule_id,
    )


async def insert_job_schedule(
    conn: asyncpg.Connection,
    *,
    schedule_id: UUID,
    name: str,
    task_name: str,
    enabled: bool,
    queue: str,
    recurrence: str,
    minute: int,
    hour: int,
    days_of_week: list[int] | None,
    day_of_month: int | None,
    month_of_year: int | None,
    interval_minutes: int | None,
    timezone: str,
    task_kwargs: dict[str, Any],
) -> asyncpg.Record:
    """Insert a new schedule row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {JOB_SCHEDULES} (
            id,
            name,
            task_name,
            enabled,
            queue,
            recurrence,
            minute,
            hour,
            days_of_week,
            day_of_month,
            month_of_year,
            interval_minutes,
            timezone,
            task_kwargs
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)
        RETURNING {_SCHEDULE_COLUMNS}
        """,
        schedule_id,
        name,
        task_name,
        enabled,
        queue,
        recurrence,
        minute,
        hour,
        days_of_week,
        day_of_month,
        month_of_year,
        interval_minutes,
        timezone,
        json.dumps(task_kwargs),
    )
    if row is None:
        raise RuntimeError("Failed to insert job schedule.")
    return row


async def update_job_schedule(
    conn: asyncpg.Connection,
    *,
    schedule_id: UUID,
    name: str,
    task_name: str,
    enabled: bool,
    queue: str,
    recurrence: str,
    minute: int,
    hour: int,
    days_of_week: list[int] | None,
    day_of_month: int | None,
    month_of_year: int | None,
    interval_minutes: int | None,
    timezone: str,
    task_kwargs: dict[str, Any],
) -> asyncpg.Record | None:
    """Update an existing schedule row."""
    return await conn.fetchrow(
        f"""
        UPDATE {JOB_SCHEDULES}
        SET
            name = $2,
            task_name = $3,
            enabled = $4,
            queue = $5,
            recurrence = $6,
            minute = $7,
            hour = $8,
            days_of_week = $9,
            day_of_month = $10,
            month_of_year = $11,
            interval_minutes = $12,
            timezone = $13,
            task_kwargs = $14::jsonb,
            updated_at = NOW()
        WHERE id = $1
        RETURNING {_SCHEDULE_COLUMNS}
        """,
        schedule_id,
        name,
        task_name,
        enabled,
        queue,
        recurrence,
        minute,
        hour,
        days_of_week,
        day_of_month,
        month_of_year,
        interval_minutes,
        timezone,
        json.dumps(task_kwargs),
    )


async def delete_job_schedule(
    conn: asyncpg.Connection,
    *,
    schedule_id: UUID,
) -> bool:
    """Delete a schedule row. Returns True when a row was removed."""
    result = await conn.execute(
        f"DELETE FROM {JOB_SCHEDULES} WHERE id = $1",
        schedule_id,
    )
    return result.endswith("1")
