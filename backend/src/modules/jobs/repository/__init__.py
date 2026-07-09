# keel_api/src/modules/jobs/repository/__init__.py

"""SQL access for job runs and schedules."""

from modules.jobs.repository.runs import (
    count_job_runs_by_schedule,
    count_job_runs_for_schedule,
    delete_job_run,
    get_job_run_by_celery_task_id,
    get_job_run_by_id,
    insert_job_run,
    last_finished_at_by_schedule,
    list_job_runs,
    mark_job_run_finished,
    mark_job_run_retry,
    mark_job_run_running,
)
from modules.jobs.repository.schedules import (
    delete_job_schedule,
    get_job_schedule_by_id,
    insert_job_schedule,
    list_enabled_job_schedules,
    list_job_schedules,
    update_job_schedule,
)

__all__ = [
    "count_job_runs_by_schedule",
    "count_job_runs_for_schedule",
    "delete_job_run",
    "delete_job_schedule",
    "get_job_run_by_celery_task_id",
    "get_job_run_by_id",
    "get_job_schedule_by_id",
    "insert_job_run",
    "last_finished_at_by_schedule",
    "insert_job_schedule",
    "list_job_runs",
    "list_job_schedules",
    "list_enabled_job_schedules",
    "mark_job_run_finished",
    "mark_job_run_retry",
    "mark_job_run_running",
    "update_job_schedule",
]
