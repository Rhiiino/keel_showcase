# keel_api/src/modules/jobs/worker/dispatch.py
"""Enqueue helpers for feature modules — create job_runs rows then publish to Redis."""

from __future__ import annotations

from typing import Any
from uuid import UUID, uuid4

from celery import Task

from core.config import get_settings
from core.database import get_pool
from core.errors import AppError
from modules.jobs import config as jobs_config
from modules.jobs import repository


async def enqueue(
    task: Task,
    *,
    queue: str = jobs_config.DEFAULT_QUEUE,
    user_id: int | None = None,
    payload: dict[str, Any] | None = None,
    triggered_by: str = "api",
    schedule_id: UUID | None = None,
    args: tuple[Any, ...] = (),
    kwargs: dict[str, Any] | None = None,
) -> UUID:
    """Insert a pending job run and publish the task to Celery."""
    settings = get_settings()
    if not settings.jobs_enabled:
        raise AppError(
            "Background jobs are disabled (JOBS_ENABLED=false).",
            status_code=503,
        )
    if queue not in jobs_config.VALID_QUEUES:
        raise AppError(f"Invalid job queue: {queue}", status_code=400)
    if triggered_by not in jobs_config.VALID_TRIGGERED_BY:
        raise AppError(f"Invalid triggered_by: {triggered_by}", status_code=400)

    run_id = uuid4()
    task_kwargs = dict(kwargs or {})
    stored_payload = dict(payload or {})
    stored_payload.setdefault("args", list(args))
    stored_payload.setdefault("kwargs", task_kwargs)

    # Insert job run row
    pool = get_pool()
    async with pool.acquire() as conn:
        await repository.insert_job_run(
            conn,
            run_id=run_id,
            celery_task_id=str(run_id),
            task_name=task.name,
            queue=queue,
            triggered_by=triggered_by,
            user_id=user_id,
            schedule_id=schedule_id,
            payload=stored_payload,
        )

    # Publish to Redis
    task.apply_async(
        args=args,
        kwargs=task_kwargs,
        task_id=str(run_id),
        queue=queue,
    )
    return run_id
