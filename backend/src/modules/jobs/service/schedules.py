# keel_api/src/modules/jobs/service/schedules.py
"""Business logic for job schedule HTTP API."""

from __future__ import annotations

from uuid import UUID, uuid4

from core.database import get_pool
from core.errors import AppError
from modules.jobs import config as jobs_config
from modules.jobs import repository
from modules.jobs.dispatch import enqueue
from modules.jobs.schemas import (
    JobRunPublic,
    JobScheduleCreate,
    JobSchedulePublic,
    JobScheduleUpdate,
    SchedulableTaskOption,
)
from modules.jobs.service._helpers import (
    days_of_week_from_row,
    parse_json_dict,
    record_to_run,
    record_to_schedule,
    validate_queue,
    validate_task_name,
)
from modules.jobs.task_kwargs import enrich_interval_task_kwargs
from modules.jobs.service.schedule_cron import validate_schedule_fields
from modules.jobs.worker.beat_loader import request_beat_schedule_sync
from modules.jobs.worker.registry import get_registered_task



# ----- Schedulable tasks
async def list_schedulable_task_options() -> list[SchedulableTaskOption]:
    """Return tasks the UI may schedule."""
    return [
        SchedulableTaskOption(task_name=task_name, label=label)
        for task_name, label in sorted(
            jobs_config.SCHEDULABLE_TASKS.items(),
            key=lambda item: item[1].lower(),
        )
    ]



# ----- Job schedules
async def list_job_schedules() -> list[JobSchedulePublic]:
    """List all configured schedules."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_job_schedules(conn)
        run_counts = await repository.count_job_runs_by_schedule(conn)
        last_runs = await repository.last_finished_at_by_schedule(conn)
    return [
        record_to_schedule(
            row,
            run_count=run_counts.get(row["id"], 0),
            last_run_at=last_runs.get(row["id"]),
        )
        for row in rows
    ]


async def get_job_schedule(schedule_id: UUID) -> JobSchedulePublic:
    """Fetch one schedule by id."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.get_job_schedule_by_id(conn, schedule_id=schedule_id)
        if row is None:
            raise AppError("Job schedule not found.", status_code=404)
        run_count = await repository.count_job_runs_for_schedule(conn, schedule_id=schedule_id)
        last_runs = await repository.last_finished_at_by_schedule(conn)
    return record_to_schedule(
        row,
        run_count=run_count,
        last_run_at=last_runs.get(schedule_id),
    )


async def create_job_schedule(payload: JobScheduleCreate) -> JobSchedulePublic:
    """Create a recurring schedule."""
    validate_task_name(payload.task_name)
    validate_queue(payload.queue)
    interval_minutes = payload.interval_minutes if payload.recurrence == "interval" else None
    validate_schedule_fields(
        recurrence=payload.recurrence,
        minute=payload.minute,
        hour=payload.hour,
        days_of_week=payload.days_of_week,
        day_of_month=payload.day_of_month if payload.recurrence in {"monthly", "yearly"} else None,
        month_of_year=payload.month_of_year if payload.recurrence == "yearly" else None,
        interval_minutes=interval_minutes,
    )

    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.insert_job_schedule(
            conn,
            schedule_id=uuid4(),
            name=payload.name.strip(),
            task_name=payload.task_name,
            enabled=payload.enabled,
            queue=payload.queue,
            recurrence=payload.recurrence,
            minute=payload.minute,
            hour=payload.hour,
            days_of_week=payload.days_of_week if payload.recurrence == "weekly" else None,
            day_of_month=payload.day_of_month if payload.recurrence in {"monthly", "yearly"} else None,
            month_of_year=payload.month_of_year if payload.recurrence == "yearly" else None,
            interval_minutes=interval_minutes,
            timezone=payload.timezone.strip() or jobs_config.DEFAULT_SCHEDULE_TIMEZONE,
            task_kwargs=payload.task_kwargs,
        )
    request_beat_schedule_sync()
    return record_to_schedule(row, run_count=0)


async def update_job_schedule(
    schedule_id: UUID,
    payload: JobScheduleUpdate,
) -> JobSchedulePublic:
    """Update an existing schedule."""
    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await repository.get_job_schedule_by_id(
            conn,
            schedule_id=schedule_id,
        )
        if existing is None:
            raise AppError("Job schedule not found.", status_code=404)

        name = payload.name.strip() if payload.name is not None else existing["name"]
        task_name = payload.task_name if payload.task_name is not None else existing["task_name"]
        enabled = payload.enabled if payload.enabled is not None else existing["enabled"]
        queue = payload.queue if payload.queue is not None else existing["queue"]
        recurrence = (
            payload.recurrence if payload.recurrence is not None else existing["recurrence"]
        )
        minute = payload.minute if payload.minute is not None else int(existing["minute"])
        hour = payload.hour if payload.hour is not None else int(existing["hour"])
        if recurrence == "weekly":
            days_of_week = (
                payload.days_of_week
                if payload.days_of_week is not None
                else days_of_week_from_row(existing["days_of_week"])
            )
        else:
            days_of_week = None
        day_of_month = (
            payload.day_of_month
            if payload.day_of_month is not None
            else existing["day_of_month"]
        )
        month_of_year = (
            payload.month_of_year
            if payload.month_of_year is not None
            else existing["month_of_year"]
        )
        if recurrence == "interval":
            interval_minutes = (
                payload.interval_minutes
                if payload.interval_minutes is not None
                else existing["interval_minutes"]
            )
            day_of_month = None
            month_of_year = None
            days_of_week = None
        else:
            interval_minutes = None
        timezone = (
            payload.timezone.strip()
            if payload.timezone is not None
            else existing["timezone"]
        )
        task_kwargs = (
            payload.task_kwargs
            if payload.task_kwargs is not None
            else parse_json_dict(existing["task_kwargs"])
        )

        validate_task_name(task_name)
        validate_queue(queue)
        validate_schedule_fields(
            recurrence=recurrence,
            minute=minute,
            hour=hour,
            days_of_week=days_of_week,
            day_of_month=day_of_month,
            month_of_year=month_of_year,
            interval_minutes=int(interval_minutes) if interval_minutes is not None else None,
        )

        row = await repository.update_job_schedule(
            conn,
            schedule_id=schedule_id,
            name=name,
            task_name=task_name,
            enabled=enabled,
            queue=queue,
            recurrence=recurrence,
            minute=minute,
            hour=hour,
            days_of_week=days_of_week,
            day_of_month=day_of_month,
            month_of_year=month_of_year,
            interval_minutes=int(interval_minutes) if interval_minutes is not None else None,
            timezone=timezone or jobs_config.DEFAULT_SCHEDULE_TIMEZONE,
            task_kwargs=task_kwargs,
        )
    if row is None:
        raise AppError("Job schedule not found.", status_code=404)
    async with pool.acquire() as conn:
        run_count = await repository.count_job_runs_for_schedule(conn, schedule_id=schedule_id)
        last_runs = await repository.last_finished_at_by_schedule(conn)
    request_beat_schedule_sync()
    return record_to_schedule(
        row,
        run_count=run_count,
        last_run_at=last_runs.get(schedule_id),
    )


async def delete_job_schedule(schedule_id: UUID) -> None:
    """Delete a schedule."""
    pool = get_pool()
    async with pool.acquire() as conn:
        deleted = await repository.delete_job_schedule(conn, schedule_id=schedule_id)
    if not deleted:
        raise AppError("Job schedule not found.", status_code=404)
    request_beat_schedule_sync()


async def run_schedule_now(schedule_id: UUID, *, user_id: int) -> JobRunPublic:
    """Enqueue the schedule's task immediately."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.get_job_schedule_by_id(conn, schedule_id=schedule_id)
        if row is None:
            raise AppError("Job schedule not found.", status_code=404)

        task_name = row["task_name"]
        if task_name not in jobs_config.SCHEDULABLE_TASKS:
            raise AppError(f"Task is not schedulable: {task_name}", status_code=400)

        schedule_name = row["name"]
        queue = row["queue"]
        recurrence = row["recurrence"]
        interval_minutes = row["interval_minutes"]
        task_kwargs = enrich_interval_task_kwargs(
            task_name,
            recurrence=recurrence,
            interval_minutes=int(interval_minutes) if interval_minutes is not None else None,
            task_kwargs=parse_json_dict(row["task_kwargs"]),
        )

    task = get_registered_task(task_name)
    run_id = await enqueue(
        task,
        queue=queue,
        user_id=user_id,
        triggered_by="manual",
        schedule_id=schedule_id,
        kwargs=task_kwargs,
    )

    async with pool.acquire() as conn:
        run_row = await repository.get_job_run_by_id(conn, run_id=run_id)
        if run_row is None:
            raise AppError("Failed to create job run.", status_code=500)

    return record_to_run(run_row, schedule_names={schedule_id: schedule_name})
