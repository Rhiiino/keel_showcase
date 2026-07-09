# keel_api/src/modules/jobs/worker/signals.py
"""Celery signal handlers that keep ``job_runs`` in sync with task lifecycle."""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from celery.signals import task_failure, task_prerun, task_retry, task_success

from core.config import get_settings
from core.database import get_pool
from modules.jobs import config as jobs_config
from modules.jobs import repository
from modules.jobs.worker.runtime import run_async

logger = logging.getLogger(__name__)


def _json_safe_result(result: Any) -> dict[str, Any] | None:
    if result is None:
        return None
    if isinstance(result, dict):
        return result
    return {"value": result}


async def _on_task_prerun(
    task_id: str,
    task_name: str,
    args: tuple[Any, ...],
    kwargs: dict[str, Any],
    queue: str | None,
) -> None:
    pool = get_pool()
    schedule_id_raw = kwargs.get("schedule_id")
    schedule_id = UUID(str(schedule_id_raw)) if schedule_id_raw else None
    payload_kwargs = {key: value for key, value in kwargs.items() if key != "schedule_id"}

    async with pool.acquire() as conn:
        existing = await repository.get_job_run_by_celery_task_id(
            conn,
            celery_task_id=task_id,
        )
        if existing is None:
            run_id = UUID(task_id)
            await repository.insert_job_run(
                conn,
                run_id=run_id,
                celery_task_id=task_id,
                task_name=task_name,
                queue=queue or jobs_config.DEFAULT_QUEUE,
                triggered_by="beat",
                user_id=None,
                schedule_id=schedule_id,
                payload={
                    "args": list(args),
                    "kwargs": payload_kwargs or {},
                },
            )
        await repository.mark_job_run_running(conn, celery_task_id=task_id)


async def _on_task_success(task_id: str, result: Any) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        await repository.mark_job_run_finished(
            conn,
            celery_task_id=task_id,
            status="success",
            result=_json_safe_result(result),
            error=None,
        )


async def _on_task_failure(
    task_id: str,
    exc: BaseException,
    traceback: str | None,
) -> None:
    pool = get_pool()
    message = str(exc) or exc.__class__.__name__
    async with pool.acquire() as conn:
        await repository.mark_job_run_finished(
            conn,
            celery_task_id=task_id,
            status="failure",
            result=None,
            error=message,
        )
    if traceback:
        logger.error("Job %s failed: %s\n%s", task_id, message, traceback)


async def _on_task_retry(task_id: str, reason: str | None) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        await repository.mark_job_run_retry(
            conn,
            celery_task_id=task_id,
            error=reason,
        )


@task_prerun.connect
def on_task_prerun(
    sender: object | None = None,
    task_id: str | None = None,
    task: object | None = None,
    args: tuple[Any, ...] | None = None,
    kwargs: dict[str, Any] | None = None,
    **_: object,
) -> None:
    """Ensure a job run exists and mark it running before task execution."""
    if not get_settings().jobs_enabled:
        return
    if task_id is None or task is None:
        return

    delivery_info = getattr(getattr(task, "request", None), "delivery_info", None) or {}
    queue = delivery_info.get("routing_key")

    try:
        run_async(
            _on_task_prerun(
                task_id,
                getattr(task, "name", str(sender)),
                args or (),
                kwargs or {},
                queue,
            )
        )
    except Exception:
        logger.exception("Failed to update job_runs on task prerun (task_id=%s)", task_id)


@task_success.connect
def on_task_success(
    sender: object | None = None,
    result: Any = None,
    **kwargs: object,
) -> None:
    """Persist successful task completion."""
    del kwargs
    if not get_settings().jobs_enabled:
        return
    task_id = getattr(getattr(sender, "request", None), "id", None)
    if not isinstance(task_id, str):
        return
    try:
        run_async(_on_task_success(task_id, result))
    except Exception:
        logger.exception("Failed to update job_runs on task success (task_id=%s)", task_id)


@task_failure.connect
def on_task_failure(
    sender: object | None = None,
    task_id: str | None = None,
    exception: BaseException | None = None,
    traceback: object | None = None,
    **_: object,
) -> None:
    """Persist task failure."""
    if not get_settings().jobs_enabled:
        return
    if task_id is None or exception is None:
        return
    trace_text = str(traceback) if traceback is not None else None
    try:
        run_async(_on_task_failure(task_id, exception, trace_text))
    except Exception:
        logger.exception("Failed to update job_runs on task failure (task_id=%s)", task_id)


@task_retry.connect
def on_task_retry(
    sender: object | None = None,
    request: object | None = None,
    reason: object | None = None,
    **_: object,
) -> None:
    """Persist task retry state."""
    if not get_settings().jobs_enabled:
        return
    task_id = getattr(request, "id", None)
    if not isinstance(task_id, str):
        return
    reason_text = str(reason) if reason is not None else None
    try:
        run_async(_on_task_retry(task_id, reason_text))
    except Exception:
        logger.exception("Failed to update job_runs on task retry (task_id=%s)", task_id)
