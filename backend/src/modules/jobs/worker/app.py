# keel_api/src/modules/jobs/worker/app.py
"""Celery application instance for Keel background workers."""

from __future__ import annotations

from celery import Celery

from core.config import get_settings
from modules.jobs import config as jobs_config

settings = get_settings()

celery_app = Celery("keel")

celery_app.conf.update(
    broker_url=settings.redis_url,
    result_backend=settings.celery_result_backend,
    task_default_queue=settings.celery_task_default_queue,
    task_track_started=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone=jobs_config.DEFAULT_SCHEDULE_TIMEZONE,
    enable_utc=True,
    beat_schedule={},
    beat_scheduler="modules.jobs.worker.beat_loader.KeelPersistentScheduler",
    beat_max_loop_interval=jobs_config.BEAT_MAX_LOOP_INTERVAL_SECONDS,
    task_routes={
        jobs_config.TASK_PURGE_EXPIRED_SESSIONS: {"queue": jobs_config.DEFAULT_QUEUE},
        jobs_config.TASK_PING: {"queue": jobs_config.DEFAULT_QUEUE},
        jobs_config.TASK_CREATE_BACKUP: {"queue": jobs_config.DEFAULT_QUEUE},
        jobs_config.TASK_CHECK_TIMELINE_REMINDERS: {"queue": jobs_config.DEFAULT_QUEUE},
        jobs_config.TASK_CHECK_SERVICES: {"queue": jobs_config.DEFAULT_QUEUE},
    },
)

celery_app.autodiscover_tasks(["modules.jobs"], related_name="tasks", force=True)

# Register signal handlers and worker DB pool lifecycle hooks.
import modules.jobs.worker.runtime  # noqa: F401, E402
import modules.jobs.worker.beat_loader  # noqa: F401, E402
import modules.jobs.worker.signals  # noqa: F401, E402
