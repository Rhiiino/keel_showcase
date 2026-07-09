# keel_api/src/modules/jobs/tasks/backup.py
"""On-demand Postgres + Garage backup task."""

from __future__ import annotations

import logging

from core.config import get_settings
from modules.jobs import config as jobs_config
from modules.jobs.tasks.backup_lib import run_full_backup
from modules.jobs.worker.app import celery_app
from modules.jobs.runtime import run_async

logger = logging.getLogger(__name__)


async def _create_backup_async() -> dict[str, object]:
    settings = get_settings()
    result = await run_full_backup(settings)
    logger.info("Backup completed: %s", result["backup_dir"])
    return result


@celery_app.task(name=jobs_config.TASK_CREATE_BACKUP, bind=True)
def create(self, **_: object) -> dict[str, object]:
    """Dump Postgres and mirror the Garage bucket to ``BACKUP_DIR``."""
    del self
    return run_async(_create_backup_async())
