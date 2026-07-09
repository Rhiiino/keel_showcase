# keel_api/src/modules/jobs/service/_helpers.py
"""Shared helpers for jobs HTTP service layer."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any
from uuid import UUID

import asyncpg

from core.errors import AppError
from modules.jobs import config as jobs_config
from modules.jobs import repository
from modules.jobs.schemas import JobRunPublic, JobSchedulePublic
from modules.jobs.service.schedule_cron import compute_next_run_at, format_schedule_summary


def task_label(task_name: str) -> str:
    """Return a display label for a Celery task name."""
    return jobs_config.SCHEDULABLE_TASKS.get(
        task_name,
        task_name.rsplit(".", maxsplit=1)[-1].replace("_", " ").title(),
    )


def parse_json_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        parsed = json.loads(value)
        if isinstance(parsed, dict):
            return parsed
    return {}


def days_of_week_from_row(value: object) -> list[int] | None:
    if value is None:
        return None
    if isinstance(value, list):
        return sorted(int(day) for day in value)
    return None


def record_to_schedule(
    row: asyncpg.Record,
    *,
    run_count: int = 0,
    last_run_at: datetime | None = None,
) -> JobSchedulePublic:
    recurrence = row["recurrence"]
    minute = int(row["minute"])
    hour = int(row["hour"])
    days_of_week = days_of_week_from_row(row["days_of_week"])
    day_of_month = row["day_of_month"]
    month_of_year = row["month_of_year"]
    interval_minutes = row["interval_minutes"]
    timezone = row["timezone"]
    return JobSchedulePublic(
        id=row["id"],
        name=row["name"],
        task_name=row["task_name"],
        task_label=task_label(row["task_name"]),
        enabled=row["enabled"],
        queue=row["queue"],
        recurrence=recurrence,
        minute=minute,
        hour=hour,
        days_of_week=days_of_week,
        day_of_month=day_of_month,
        month_of_year=month_of_year,
        interval_minutes=int(interval_minutes) if interval_minutes is not None else None,
        timezone=timezone,
        task_kwargs=parse_json_dict(row["task_kwargs"]),
        schedule_summary=format_schedule_summary(
            recurrence=recurrence,
            minute=minute,
            hour=hour,
            days_of_week=days_of_week,
            day_of_month=day_of_month,
            month_of_year=month_of_year,
            interval_minutes=int(interval_minutes) if interval_minutes is not None else None,
            timezone=timezone,
        ),
        next_run_at=compute_next_run_at(
            enabled=row["enabled"],
            recurrence=recurrence,
            minute=minute,
            hour=hour,
            days_of_week=days_of_week,
            day_of_month=day_of_month,
            month_of_year=month_of_year,
            interval_minutes=int(interval_minutes) if interval_minutes is not None else None,
            timezone=timezone,
            last_run_at=last_run_at,
            schedule_anchor_at=row["updated_at"],
        ),
        run_count=run_count,
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def record_to_run(
    row: asyncpg.Record,
    *,
    schedule_names: dict[UUID, str] | None = None,
) -> JobRunPublic:
    schedule_id = row["schedule_id"]
    schedule_name = None
    if schedule_id is not None and schedule_names is not None:
        schedule_name = schedule_names.get(schedule_id)
    return JobRunPublic(
        id=row["id"],
        celery_task_id=row["celery_task_id"],
        task_name=row["task_name"],
        task_label=task_label(row["task_name"]),
        queue=row["queue"],
        status=row["status"],
        triggered_by=row["triggered_by"],
        user_id=row["user_id"],
        schedule_id=schedule_id,
        schedule_name=schedule_name,
        payload=parse_json_dict(row["payload"]),
        result=parse_json_dict(row["result"]) if row["result"] is not None else None,
        error=row["error"],
        created_at=row["created_at"],
        started_at=row["started_at"],
        finished_at=row["finished_at"],
    )


async def schedule_name_map(conn: asyncpg.Connection) -> dict[UUID, str]:
    rows = await repository.list_job_schedules(conn)
    return {row["id"]: row["name"] for row in rows}


def validate_task_name(task_name: str) -> None:
    if task_name not in jobs_config.SCHEDULABLE_TASKS:
        raise AppError(f"Task is not schedulable: {task_name}", status_code=400)


def validate_queue(queue: str) -> None:
    if queue not in jobs_config.VALID_QUEUES:
        raise AppError(f"Invalid queue: {queue}", status_code=400)
