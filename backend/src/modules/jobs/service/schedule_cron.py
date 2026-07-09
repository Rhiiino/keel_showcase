# keel_api/src/modules/jobs/service/schedule_cron.py
"""Map stored schedule fields to Celery crontab and human-readable summaries."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from celery.schedules import crontab, schedule as celery_schedule

from core.errors import AppError
from modules.jobs import config as jobs_config

_DAY_NAMES = ("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
_MONTH_NAMES = (
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
)


def _format_time(hour: int, minute: int) -> str:
    return f"{hour:02d}:{minute:02d}"


def _normalize_days_of_week(days_of_week: list[int] | None) -> list[int] | None:
    if not days_of_week:
        return None
    normalized = sorted(set(days_of_week))
    return normalized or None


def _validate_days_of_week(days_of_week: list[int] | None) -> None:
    if not days_of_week:
        return
    if not 1 <= len(days_of_week) <= 7:
        raise AppError("days_of_week must include between 1 and 7 unique days.", status_code=400)
    for day in days_of_week:
        if not 0 <= day <= 6:
            raise AppError("days_of_week values must be between 0 (Sun) and 6 (Sat).", status_code=400)


def _format_days_of_week(days_of_week: list[int]) -> str:
    names = [_DAY_NAMES[day] for day in days_of_week]
    if len(names) == 1:
        return names[0]
    if len(names) == 2:
        return f"{names[0]} and {names[1]}"
    return ", ".join(names[:-1]) + f", and {names[-1]}"


def validate_schedule_fields(
    *,
    recurrence: str,
    minute: int,
    hour: int,
    days_of_week: list[int] | None,
    day_of_month: int | None,
    month_of_year: int | None,
    interval_minutes: int | None = None,
) -> None:
    """Raise AppError when recurrence-specific fields are invalid."""
    if recurrence not in jobs_config.VALID_RECURRENCES:
        raise AppError(f"Invalid recurrence: {recurrence}", status_code=400)

    if recurrence == "interval":
        if interval_minutes is None:
            raise AppError("interval_minutes is required for interval schedules.", status_code=400)
        if not jobs_config.MIN_INTERVAL_MINUTES <= interval_minutes <= jobs_config.MAX_INTERVAL_MINUTES:
            raise AppError(
                f"interval_minutes must be between {jobs_config.MIN_INTERVAL_MINUTES} "
                f"and {jobs_config.MAX_INTERVAL_MINUTES}.",
                status_code=400,
            )
        return

    if not 0 <= minute <= 59:
        raise AppError("minute must be between 0 and 59.", status_code=400)
    if not 0 <= hour <= 23:
        raise AppError("hour must be between 0 and 23.", status_code=400)

    normalized_days = _normalize_days_of_week(days_of_week)
    if recurrence == "weekly":
        if not normalized_days:
            raise AppError("days_of_week is required for weekly schedules.", status_code=400)
        _validate_days_of_week(normalized_days)
    elif recurrence in {"monthly", "yearly"}:
        if day_of_month is None:
            raise AppError("day_of_month is required for monthly and yearly schedules.", status_code=400)
        if not 1 <= day_of_month <= 31:
            raise AppError("day_of_month must be between 1 and 31.", status_code=400)
    if recurrence == "yearly":
        if month_of_year is None:
            raise AppError("month_of_year is required for yearly schedules.", status_code=400)
        if not 1 <= month_of_year <= 12:
            raise AppError("month_of_year must be between 1 and 12.", status_code=400)


def schedule_to_crontab(
    *,
    recurrence: str,
    minute: int,
    hour: int,
    days_of_week: list[int] | None = None,
    day_of_month: int | None = None,
    month_of_year: int | None = None,
    interval_minutes: int | None = None,
) -> crontab:
    """Build a Celery crontab from stored schedule fields."""
    if recurrence == "interval":
        raise AppError("Interval schedules do not use crontab.", status_code=400)

    normalized_days = _normalize_days_of_week(days_of_week)
    validate_schedule_fields(
        recurrence=recurrence,
        minute=minute,
        hour=hour,
        days_of_week=normalized_days,
        day_of_month=day_of_month,
        month_of_year=month_of_year,
        interval_minutes=interval_minutes,
    )
    if recurrence == "daily":
        return crontab(minute=minute, hour=hour)
    if recurrence == "weekly":
        day_pattern = ",".join(str(day) for day in normalized_days or [])
        return crontab(minute=minute, hour=hour, day_of_week=day_pattern)
    if recurrence == "monthly":
        return crontab(minute=minute, hour=hour, day_of_month=day_of_month)
    return crontab(
        minute=minute,
        hour=hour,
        day_of_month=day_of_month,
        month_of_year=month_of_year,
    )


def schedule_to_beat_entry(
    *,
    recurrence: str,
    minute: int,
    hour: int,
    days_of_week: list[int] | None = None,
    day_of_month: int | None = None,
    month_of_year: int | None = None,
    interval_minutes: int | None = None,
) -> crontab | celery_schedule:
    """Build a Celery Beat schedule entry from stored schedule fields."""
    if recurrence == "interval":
        validate_schedule_fields(
            recurrence=recurrence,
            minute=minute,
            hour=hour,
            days_of_week=days_of_week,
            day_of_month=day_of_month,
            month_of_year=month_of_year,
            interval_minutes=interval_minutes,
        )
        return celery_schedule(run_every=timedelta(minutes=int(interval_minutes or 0)))
    return schedule_to_crontab(
        recurrence=recurrence,
        minute=minute,
        hour=hour,
        days_of_week=days_of_week,
        day_of_month=day_of_month,
        month_of_year=month_of_year,
        interval_minutes=interval_minutes,
    )


def _timezone_label(timezone: str) -> str:
    normalized = timezone.strip()
    if normalized in {"America/New_York", "US/Eastern", "ET"}:
        return "ET"
    if normalized == "UTC":
        return "UTC"
    return normalized


def format_schedule_summary(
    *,
    recurrence: str,
    minute: int,
    hour: int,
    days_of_week: list[int] | None = None,
    day_of_month: int | None = None,
    month_of_year: int | None = None,
    interval_minutes: int | None = None,
    timezone: str = jobs_config.DEFAULT_SCHEDULE_TIMEZONE,
) -> str:
    """Return a short human-readable schedule description."""
    if recurrence == "interval" and interval_minutes is not None:
        if interval_minutes == 1:
            return "Every minute"
        return f"Every {interval_minutes} minutes"

    time_label = _format_time(hour, minute)
    tz_suffix = f" {_timezone_label(timezone)}"
    normalized_days = _normalize_days_of_week(days_of_week)

    if recurrence == "daily":
        return f"Daily at {time_label}{tz_suffix}"
    if recurrence == "weekly" and normalized_days:
        return f"Weekly on {_format_days_of_week(normalized_days)} at {time_label}{tz_suffix}"
    if recurrence == "monthly" and day_of_month is not None:
        return f"Monthly on day {day_of_month} at {time_label}{tz_suffix}"
    if (
        recurrence == "yearly"
        and day_of_month is not None
        and month_of_year is not None
    ):
        return (
            f"Yearly on {_MONTH_NAMES[month_of_year]} {day_of_month} "
            f"at {time_label}{tz_suffix}"
        )
    return recurrence


def _schedule_timezone(recurrence: str, timezone: str) -> ZoneInfo:
    if recurrence == "interval":
        return ZoneInfo("UTC")
    return ZoneInfo(timezone.strip())


def _normalize_schedule_datetime(value: datetime, tz: ZoneInfo) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=ZoneInfo("UTC")).astimezone(tz)
    return value.astimezone(tz)


def compute_next_run_at(
    *,
    enabled: bool,
    recurrence: str,
    minute: int,
    hour: int,
    days_of_week: list[int] | None = None,
    day_of_month: int | None = None,
    month_of_year: int | None = None,
    interval_minutes: int | None = None,
    timezone: str = jobs_config.DEFAULT_SCHEDULE_TIMEZONE,
    last_run_at: datetime | None = None,
    schedule_anchor_at: datetime | None = None,
) -> datetime | None:
    """Return the next scheduled fire time in the schedule timezone, or None when disabled."""
    if not enabled:
        return None

    if recurrence == "interval" and interval_minutes is None:
        return None

    tz = _schedule_timezone(recurrence, timezone)
    beat_schedule = schedule_to_beat_entry(
        recurrence=recurrence,
        minute=minute,
        hour=hour,
        days_of_week=days_of_week,
        day_of_month=day_of_month,
        month_of_year=month_of_year,
        interval_minutes=interval_minutes,
    )
    beat_schedule.nowfun = lambda: datetime.now(tz)
    now = beat_schedule.nowfun()

    if last_run_at is not None:
        anchor = _normalize_schedule_datetime(last_run_at, tz)
    elif recurrence == "interval" and schedule_anchor_at is not None:
        anchor = _normalize_schedule_datetime(schedule_anchor_at, tz)
    else:
        anchor = now

    return now + beat_schedule.remaining_estimate(last_run_at=anchor)
