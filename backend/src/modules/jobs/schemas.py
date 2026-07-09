# keel_api/src/modules/jobs/schemas.py
"""Pydantic models for job runs and schedules."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from modules.jobs import config as jobs_config

JobRunStatus = Literal["pending", "running", "success", "failure", "retry"]
JobTriggeredBy = Literal["api", "beat", "manual"]
JobRecurrence = Literal["daily", "weekly", "monthly", "yearly", "interval"]


def _normalize_days_of_week(days: list[int] | None) -> list[int] | None:
    if days is None:
        return None
    normalized = sorted(set(days))
    if not normalized:
        return None
    return normalized


class _DaysOfWeekMixin(BaseModel):
    days_of_week: list[int] | None = None

    @field_validator("days_of_week")
    @classmethod
    def validate_days_of_week(cls, value: list[int] | None) -> list[int] | None:
        normalized = _normalize_days_of_week(value)
        if normalized is None:
            return None
        for day in normalized:
            if not 0 <= day <= 6:
                raise ValueError("days_of_week values must be between 0 (Sun) and 6 (Sat).")
        return normalized


class JobRunRecord(BaseModel):
    """Row shape for ``job_runs`` queries."""

    id: UUID
    celery_task_id: str
    task_name: str
    queue: str
    status: str
    triggered_by: str
    user_id: int | None
    schedule_id: UUID | None = None
    payload: dict[str, Any]
    result: dict[str, Any] | None
    error: str | None
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None


class JobRunPublic(BaseModel):
    """HTTP response for a job run."""

    id: UUID
    celery_task_id: str
    task_name: str
    task_label: str
    queue: str
    status: JobRunStatus
    triggered_by: JobTriggeredBy
    user_id: int | None
    schedule_id: UUID | None
    schedule_name: str | None
    payload: dict[str, Any]
    result: dict[str, Any] | None
    error: str | None
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None


class JobSchedulePublic(BaseModel):
    """HTTP response for a configured schedule."""

    id: UUID
    name: str
    task_name: str
    task_label: str
    enabled: bool
    queue: str
    recurrence: JobRecurrence
    minute: int
    hour: int
    days_of_week: list[int] | None
    day_of_month: int | None
    month_of_year: int | None
    interval_minutes: int | None = None
    timezone: str
    task_kwargs: dict[str, Any]
    schedule_summary: str
    next_run_at: datetime | None
    run_count: int = 0
    created_at: datetime
    updated_at: datetime


class JobScheduleCreate(_DaysOfWeekMixin):
    """Create a recurring schedule."""

    name: str = Field(min_length=1, max_length=120)
    task_name: str
    enabled: bool = True
    queue: str = "default"
    recurrence: JobRecurrence
    minute: int = Field(ge=0, le=59)
    hour: int = Field(ge=0, le=23)
    day_of_month: int | None = Field(default=None, ge=1, le=31)
    month_of_year: int | None = Field(default=None, ge=1, le=12)
    interval_minutes: int | None = Field(default=None, ge=1, le=1440)
    timezone: str = jobs_config.DEFAULT_SCHEDULE_TIMEZONE
    task_kwargs: dict[str, Any] = Field(default_factory=dict)


class JobScheduleUpdate(_DaysOfWeekMixin):
    """Partial update for a schedule."""

    name: str | None = Field(default=None, min_length=1, max_length=120)
    task_name: str | None = None
    enabled: bool | None = None
    queue: str | None = None
    recurrence: JobRecurrence | None = None
    minute: int | None = Field(default=None, ge=0, le=59)
    hour: int | None = Field(default=None, ge=0, le=23)
    day_of_month: int | None = Field(default=None, ge=1, le=31)
    month_of_year: int | None = Field(default=None, ge=1, le=12)
    interval_minutes: int | None = Field(default=None, ge=1, le=1440)
    timezone: str | None = None
    task_kwargs: dict[str, Any] | None = None


class SchedulableTaskOption(BaseModel):
    """Task available for scheduling in the UI."""

    task_name: str
    label: str


class JobTaskKwargSpec(BaseModel):
    """Documented keyword argument for a registered task."""

    name: str
    type: str
    default: str | None = None
    description: str | None = None


class JobTaskPublic(BaseModel):
    """HTTP response for a registered background task."""

    task_name: str
    label: str
    description: str
    queue: str
    schedulable: bool
    kwargs: list[JobTaskKwargSpec]
