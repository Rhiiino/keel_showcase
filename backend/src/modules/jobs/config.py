# keel_api/src/modules/jobs/config.py
"""Jobs module constants — queues, task names, and validation sets."""

from __future__ import annotations

from dataclasses import dataclass

DEFAULT_QUEUE = "default"
HEAVY_QUEUE = "heavy"

VALID_QUEUES: frozenset[str] = frozenset({DEFAULT_QUEUE, HEAVY_QUEUE})
VALID_STATUSES: frozenset[str] = frozenset(
    {"pending", "running", "success", "failure", "retry"}
)
VALID_TRIGGERED_BY: frozenset[str] = frozenset({"api", "beat", "manual"})

TASK_PING = "jobs.tasks.ping.run"
TASK_PURGE_EXPIRED_SESSIONS = "jobs.tasks.maintenance.purge_expired_sessions"
TASK_PURGE_EXPIRED_DELETED_RECORDS = "jobs.tasks.maintenance.purge_expired_deleted_records"
TASK_CREATE_BACKUP = "jobs.tasks.backup.create"
TASK_CHECK_TIMELINE_REMINDERS = "jobs.tasks.timeline.check_reminders"
TASK_CHECK_SERVICES = "jobs.tasks.services.check_all"

# ----- HTTP API
FEATURE_KEY = "jobs"
OPENAPI_TAG = "jobs"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

RUNS_PATH = "/runs"
RUN_BY_ID_PATH = "/runs/{run_id}"
SCHEDULES_PATH = "/schedules"
SCHEDULE_BY_ID_PATH = "/schedules/{schedule_id}"
SCHEDULE_RUN_PATH = "/schedules/{schedule_id}/run"
SCHEDULE_TASK_OPTIONS_PATH = "/schedules/task-options"
TASKS_PATH = "/tasks"

DEFAULT_SCHEDULE_TIMEZONE = "America/New_York"

VALID_RECURRENCES: frozenset[str] = frozenset(
    {"daily", "weekly", "monthly", "yearly", "interval"}
)

MIN_INTERVAL_MINUTES = 1
MAX_INTERVAL_MINUTES = 1440

# Redis flag the API sets when job_schedules change; Beat clears it after reload.
BEAT_SCHEDULE_DIRTY_KEY = "jobs:beat_schedule:dirty"

# Beat checks for schedule changes at least this often (seconds), even when the
# next due task is farther out than the default 5-minute Celery max sleep.
BEAT_MAX_LOOP_INTERVAL_SECONDS = 15

SCHEDULABLE_TASKS: dict[str, str] = {
    TASK_PING: "Simple ping",
    TASK_PURGE_EXPIRED_SESSIONS: "Purge expired sessions",
    TASK_PURGE_EXPIRED_DELETED_RECORDS: "Purge expired deleted records",
    TASK_CREATE_BACKUP: "Database + Garage backup",
    TASK_CHECK_TIMELINE_REMINDERS: "Check timeline reminders",
    TASK_CHECK_SERVICES: "Check service health",
}



# ----- Task catalog (read-only HTTP metadata)
@dataclass(frozen=True)
class TaskCatalogKwarg:
    """Documented keyword argument for a registered Celery task."""

    name: str
    type: str
    default: str | None = None
    description: str | None = None


@dataclass(frozen=True)
class TaskCatalogEntry:
    """Static metadata for a registered Celery task."""

    description: str
    queue: str = DEFAULT_QUEUE
    kwargs: tuple[TaskCatalogKwarg, ...] = ()


TASK_CATALOG: dict[str, TaskCatalogEntry] = {
    TASK_PING: TaskCatalogEntry(
        description="Log and return a simple success payload.",
    ),
    TASK_PURGE_EXPIRED_SESSIONS: TaskCatalogEntry(
        description="Delete auth session rows whose expires_at is in the past.",
    ),
    TASK_PURGE_EXPIRED_DELETED_RECORDS: TaskCatalogEntry(
        description="Permanently purge deleted_records rows past retention.",
    ),
    TASK_CREATE_BACKUP: TaskCatalogEntry(
        description="Dump Postgres and mirror the Garage bucket to BACKUP_DIR.",
    ),
    TASK_CHECK_TIMELINE_REMINDERS: TaskCatalogEntry(
        description="Scan timeline event reminders and log due entries (no delivery yet).",
        kwargs=(
            TaskCatalogKwarg(
                name="lookback_minutes",
                type="integer",
                default="5",
                description="How far back to scan for due reminders.",
            ),
        ),
    ),
    TASK_CHECK_SERVICES: TaskCatalogEntry(
        description="HTTP-probe all services with check_enabled and update health status.",
    ),
}
