# keel_api/src/modules/jobs/tasks/maintenance.py
"""Scheduled and on-demand maintenance tasks."""

from __future__ import annotations

import logging

from core.database import get_pool
from modules.auth import repository as auth_repository
from modules.deleted import service as deleted_service
from modules.jobs import config as jobs_config
from modules.jobs.worker.app import celery_app
from modules.jobs.runtime import run_async

logger = logging.getLogger(__name__)


async def _purge_expired_sessions_async() -> dict[str, int]:
    pool = get_pool()
    async with pool.acquire() as conn:
        deleted_count = await auth_repository.delete_expired_sessions(conn)
    logger.info("Purged %s expired auth session rows", deleted_count)
    return {"deleted_count": deleted_count}


async def _purge_expired_deleted_records_async() -> dict[str, int]:
    result = await deleted_service.purge_expired_deleted_records()
    logger.info("Purged %s expired deleted_records rows", result["purged_count"])
    return result


@celery_app.task(name=jobs_config.TASK_PURGE_EXPIRED_SESSIONS, bind=True)
def purge_expired_sessions(self, **_: object) -> dict[str, int]:
    """Delete auth session rows whose ``expires_at`` is in the past."""
    del self
    return run_async(_purge_expired_sessions_async())


@celery_app.task(name=jobs_config.TASK_PURGE_EXPIRED_DELETED_RECORDS, bind=True)
def purge_expired_deleted_records(self, **_: object) -> dict[str, int]:
    """Permanently purge deleted_records rows past retention."""
    del self
    return run_async(_purge_expired_deleted_records_async())
