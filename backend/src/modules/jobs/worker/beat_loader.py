# keel_api/src/modules/jobs/worker/beat_loader.py
"""Load enabled ``job_schedules`` rows into Celery Beat and reload on API changes."""

from __future__ import annotations

import json
import logging
from typing import Any

import redis
from celery.beat import PersistentScheduler
from celery.signals import beat_init

from core.config import get_settings
from core.database import get_pool
from modules.jobs import config as jobs_config
from modules.jobs import repository
from modules.jobs.task_kwargs import enrich_interval_task_kwargs
from modules.jobs.service.schedule_cron import schedule_to_beat_entry
from modules.jobs.worker.app import celery_app
from modules.jobs.worker.runtime import run_async

logger = logging.getLogger(__name__)

_beat_scheduler: object | None = None



# ----- Beat schedule construction
def _parse_task_kwargs(value: object) -> dict[str, Any]:
    if isinstance(value, dict):
        return dict(value)
    if isinstance(value, str):
        parsed = json.loads(value)
        if isinstance(parsed, dict):
            return parsed
    return {}


def _build_beat_schedule(rows: list[Any]) -> dict[str, dict[str, object]]:
    beat_schedule: dict[str, dict[str, object]] = {}

    for row in rows:
        recurrence = row["recurrence"]
        interval_minutes = row["interval_minutes"]
        task_kwargs = enrich_interval_task_kwargs(
            row["task_name"],
            recurrence=recurrence,
            interval_minutes=int(interval_minutes) if interval_minutes is not None else None,
            task_kwargs=_parse_task_kwargs(row["task_kwargs"]),
        )

        task_kwargs["schedule_id"] = str(row["id"])

        beat_schedule[row["name"]] = {
            "task": row["task_name"],
            "schedule": schedule_to_beat_entry(
                recurrence=recurrence,
                minute=int(row["minute"]),
                hour=int(row["hour"]),
                days_of_week=list(row["days_of_week"]) if row["days_of_week"] else None,
                day_of_month=row["day_of_month"],
                month_of_year=row["month_of_year"],
                interval_minutes=int(interval_minutes) if interval_minutes is not None else None,
            ),
            "kwargs": task_kwargs,
            "options": {"queue": row["queue"]},
        }

    return beat_schedule


async def _load_enabled_schedules_async() -> dict[str, dict[str, object]]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_enabled_job_schedules(conn)
    return _build_beat_schedule(rows)


def _apply_beat_schedule(
    scheduler: object | None,
    beat_schedule: dict[str, dict[str, object]],
) -> None:
    celery_app.conf.beat_schedule = beat_schedule
    if scheduler is None:
        return
    if hasattr(scheduler, "merge_inplace"):
        scheduler.merge_inplace(beat_schedule)
    elif hasattr(scheduler, "update_from_dict"):
        scheduler.update_from_dict(beat_schedule)
    if hasattr(scheduler, "sync"):
        scheduler.sync()


def sync_beat_schedule_from_database(*, scheduler: object | None = None) -> None:
    """Replace Celery Beat entries with enabled rows from ``job_schedules``."""
    if not get_settings().jobs_enabled:
        logger.info("Jobs disabled — skipping Beat schedule sync.")
        return

    active_scheduler = scheduler if scheduler is not None else _beat_scheduler
    beat_schedule = run_async(_load_enabled_schedules_async())
    _apply_beat_schedule(active_scheduler, beat_schedule)
    logger.info("Loaded %s enabled job schedule(s) into Celery Beat.", len(beat_schedule))



# ----- Live reload from API schedule changes
def _redis_client() -> redis.Redis:
    return redis.from_url(get_settings().redis_url)


def request_beat_schedule_sync() -> None:
    """Mark Beat's in-memory schedule stale so the next tick reloads from Postgres."""
    if not get_settings().jobs_enabled:
        return
    try:
        _redis_client().set(jobs_config.BEAT_SCHEDULE_DIRTY_KEY, "1", ex=300)
    except Exception:
        logger.exception("Failed to notify Celery Beat of schedule change.")


def _consume_beat_schedule_sync_request(scheduler: object) -> None:
    try:
        client = _redis_client()
        if not client.get(jobs_config.BEAT_SCHEDULE_DIRTY_KEY):
            return
        sync_beat_schedule_from_database(scheduler=scheduler)
        client.delete(jobs_config.BEAT_SCHEDULE_DIRTY_KEY)
    except Exception:
        logger.exception("Failed to reload Celery Beat schedule from Postgres.")



# ----- Celery Beat scheduler
class KeelPersistentScheduler(PersistentScheduler):
    """Persistent Beat scheduler that reloads enabled DB schedules when the API changes them."""

    def tick(self, *args: object, **kwargs: object) -> float:
        _consume_beat_schedule_sync_request(self)
        return super().tick(*args, **kwargs)



@beat_init.connect
def on_beat_init(sender: object | None = None, **_: object) -> None:
    """Populate Beat schedule from Postgres when the Beat process starts."""
    global _beat_scheduler
    try:
        beat_scheduler = getattr(sender, "scheduler", None) if sender is not None else None
        _beat_scheduler = beat_scheduler
        sync_beat_schedule_from_database(scheduler=beat_scheduler)
    except Exception:
        logger.exception("Failed to load job schedules into Celery Beat.")
