# keel_api/src/modules/jobs/tasks/timeline.py
"""Timeline reminder polling tasks."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from core.database import get_pool
from modules.jobs import config as jobs_config
from modules.jobs.worker.app import celery_app
from modules.jobs.runtime import run_async
from modules.timeline import repository as timeline_repository

logger = logging.getLogger(__name__)

DEFAULT_LOOKBACK_MINUTES = 5


async def _check_timeline_reminders_async(
    *,
    lookback_minutes: int = DEFAULT_LOOKBACK_MINUTES,
) -> dict[str, object]:
    if lookback_minutes < 1:
        raise ValueError("lookback_minutes must be at least 1.")

    now = datetime.now(UTC)
    pool = get_pool()
    async with pool.acquire() as conn:
        due_rows = await timeline_repository.fetch_due_reminders(
            conn,
            as_of=now,
            lookback_minutes=lookback_minutes,
        )
        reminder_ids = [int(row["id"]) for row in due_rows]

        for row in due_rows:
            logger.info(
                "Timeline reminder due (dry run)",
                extra={
                    "reminder_id": row["id"],
                    "timeline_event_id": row["timeline_event_id"],
                    "user_id": row["user_id"],
                    "notify_at": row["notify_at"].isoformat(),
                    "start_date": row["start_date"].isoformat(),
                    "amount": row["amount"],
                    "unit": row["unit"],
                },
            )

        marked_count = await timeline_repository.mark_reminders_sent(
            conn,
            reminder_ids,
            sent_at=now,
        )

    return {
        "checked_at": now.isoformat(),
        "lookback_minutes": lookback_minutes,
        "due_count": len(due_rows),
        "marked_count": marked_count,
        "reminder_ids": reminder_ids,
    }


@celery_app.task(name=jobs_config.TASK_CHECK_TIMELINE_REMINDERS, bind=True)
def check_reminders(
    self,
    *,
    lookback_minutes: int = DEFAULT_LOOKBACK_MINUTES,
    **_: object,
) -> dict[str, object]:
    """Scan timeline event reminders and log due entries (no delivery yet)."""
    del self
    return run_async(_check_timeline_reminders_async(lookback_minutes=lookback_minutes))
