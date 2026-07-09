# keel_api/src/modules/jobs/tasks/services.py

"""Batch health checks for monitored HTTP services."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime

import asyncpg

from core.database import get_pool
from modules.jobs import config as jobs_config
from modules.jobs.runtime import run_async
from modules.jobs.worker.app import celery_app
from modules.services import repository
from modules.services.check import probe_service_row

logger = logging.getLogger(__name__)

MAX_CONCURRENT_PROBES = 10


async def _check_all_services_async() -> dict[str, object]:
    checked_at = datetime.now(UTC)
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.fetch_services_for_check(conn)

    if not rows:
        return {
            "checked_at": checked_at.isoformat(),
            "checked_count": 0,
            "up_count": 0,
            "caution_count": 0,
            "down_count": 0,
            "service_ids": [],
        }

    semaphore = asyncio.Semaphore(MAX_CONCURRENT_PROBES)

    async def probe_one(row: asyncpg.Record) -> tuple[int, str]:
        async with semaphore:
            async with pool.acquire() as conn:
                public = await probe_service_row(conn, row, checked_at=checked_at)
            return public.id, public.last_status or "unknown"

    results = await asyncio.gather(
        *[probe_one(row) for row in rows],
        return_exceptions=True,
    )

    service_ids: list[int] = []
    up_count = 0
    caution_count = 0
    down_count = 0

    for index, result in enumerate(results):
        if isinstance(result, BaseException):
            logger.exception(
                "Service health check failed for row id=%s",
                rows[index]["id"],
                exc_info=result,
            )
            continue
        service_id, last_status = result
        service_ids.append(service_id)
        if last_status == "up":
            up_count += 1
        elif last_status == "caution":
            caution_count += 1
        elif last_status == "down":
            down_count += 1

    return {
        "checked_at": checked_at.isoformat(),
        "checked_count": len(service_ids),
        "up_count": up_count,
        "caution_count": caution_count,
        "down_count": down_count,
        "service_ids": service_ids,
    }


@celery_app.task(name=jobs_config.TASK_CHECK_SERVICES, bind=True)
def check_all(self, **_: object) -> dict[str, object]:
    """Probe all services with check_enabled and update their health status."""
    del self
    return run_async(_check_all_services_async())
