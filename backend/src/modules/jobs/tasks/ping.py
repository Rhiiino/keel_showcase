# keel_api/src/modules/jobs/tasks/ping.py
"""Smoke task for verifying worker, Redis, and job_runs tracking."""

from __future__ import annotations

import logging

from modules.jobs import config as jobs_config
from modules.jobs.worker.app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name=jobs_config.TASK_PING, bind=True)
def run(self, **_: object) -> dict[str, bool]:
    """Log and return a simple success payload."""
    logger.info("jobs ping task executed (task_id=%s)", self.request.id)
    return {"ok": True}
