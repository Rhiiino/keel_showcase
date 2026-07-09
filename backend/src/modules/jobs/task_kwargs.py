# keel_api/src/modules/jobs/task_kwargs.py
"""Shared helpers for Celery task kwargs on scheduled jobs."""

from __future__ import annotations

from typing import Any

from modules.jobs import config as jobs_config


def enrich_interval_task_kwargs(
    task_name: str,
    *,
    recurrence: str,
    interval_minutes: int | None,
    task_kwargs: dict[str, Any],
) -> dict[str, Any]:
    """Default interval kwargs for tasks that interpret them (e.g. timeline reminders)."""
    enriched = dict(task_kwargs)
    if (
        recurrence == "interval"
        and interval_minutes is not None
        and task_name == jobs_config.TASK_CHECK_TIMELINE_REMINDERS
    ):
        enriched.setdefault("lookback_minutes", int(interval_minutes))
    return enriched
