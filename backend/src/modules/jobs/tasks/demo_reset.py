# keel_api/src/modules/jobs/tasks/demo_reset.py
"""Server-only demo baseline snapshot and nightly restore tasks."""

from __future__ import annotations

import logging

from core.config import get_settings
from modules.jobs import config as jobs_config
from modules.jobs.tasks.demo_reset_lib import (
    create_baseline_snapshot,
    restore_baseline_snapshot,
)
from modules.jobs.worker.app import celery_app
from modules.jobs.worker.runtime import run_async

logger = logging.getLogger(__name__)


async def _create_snapshot_async() -> dict[str, object]:
    settings = get_settings()
    result = await create_baseline_snapshot(settings)
    logger.info("Demo baseline snapshot created: %s", result["snapshot_dir"])
    return result


async def _restore_snapshot_async() -> dict[str, object]:
    settings = get_settings()
    if not settings.demo_reset_enabled:
        raise RuntimeError("Demo reset is disabled (DEMO_RESET_ENABLED=false).")

    result = await restore_baseline_snapshot(settings)
    logger.info("Demo baseline restore completed: %s", result["snapshot_dir"])
    return result


@celery_app.task(name=jobs_config.TASK_CREATE_DEMO_SNAPSHOT, bind=True)
def create_snapshot(self, **_: object) -> dict[str, object]:
    """Capture the current Postgres + Garage state into the demo baseline directory."""
    del self
    return run_async(_create_snapshot_async())


@celery_app.task(name=jobs_config.TASK_RESTORE_DEMO_SNAPSHOT, bind=True)
def restore(self, **_: object) -> dict[str, object]:
    """Restore the demo Postgres database and Garage bucket from the baseline snapshot."""
    del self
    return run_async(_restore_snapshot_async())
