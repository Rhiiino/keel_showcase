# keel_api/src/modules/jobs/worker/registry.py
"""Resolve Celery task objects from registered task names."""

from __future__ import annotations

from celery import Task

from core.errors import AppError
from modules.jobs import config as jobs_config
from modules.jobs.tasks.backup import create as backup_create
from modules.jobs.tasks.maintenance import (
    purge_expired_deleted_records,
    purge_expired_sessions,
)
from modules.jobs.tasks.ping import run as ping_run

from modules.jobs.tasks.services import check_all as services_check_all
from modules.jobs.tasks.timeline import check_reminders

TASK_REGISTRY: dict[str, Task] = {
    jobs_config.TASK_PING: ping_run,
    jobs_config.TASK_PURGE_EXPIRED_SESSIONS: purge_expired_sessions,
    jobs_config.TASK_PURGE_EXPIRED_DELETED_RECORDS: purge_expired_deleted_records,
    jobs_config.TASK_CREATE_BACKUP: backup_create,
    jobs_config.TASK_CHECK_TIMELINE_REMINDERS: check_reminders,
    jobs_config.TASK_CHECK_SERVICES: services_check_all,
}


def get_registered_task(task_name: str) -> Task:
    """Return the Celery task for a known task name."""
    task = TASK_REGISTRY.get(task_name)
    if task is None:
        raise AppError(f"Unknown job task: {task_name}", status_code=400)
    return task
