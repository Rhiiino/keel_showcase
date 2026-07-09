# keel_api/src/modules/jobs/service/runs.py
"""Business logic for job run history HTTP API."""

from __future__ import annotations

from uuid import UUID

from core.database import get_pool
from core.errors import AppError
from modules.jobs import config as jobs_config
from modules.jobs import repository
from modules.jobs.schemas import JobRunPublic
from modules.jobs.service._helpers import record_to_run, schedule_name_map



# ----- Job runs
async def list_job_runs(
    *,
    status: str | None = None,
    task_name: str | None = None,
    schedule_id: UUID | None = None,
    triggered_by: str | None = None,
    limit: int = 200,
    offset: int = 0,
) -> list[JobRunPublic]:
    """List job runs for the jobs UI."""
    if status is not None and status not in jobs_config.VALID_STATUSES:
        raise AppError(f"Invalid status filter: {status}", status_code=400)
    if triggered_by is not None and triggered_by not in jobs_config.VALID_TRIGGERED_BY:
        raise AppError(f"Invalid triggered_by filter: {triggered_by}", status_code=400)
    if limit < 1 or limit > 500:
        raise AppError("limit must be between 1 and 500.", status_code=400)
    if offset < 0:
        raise AppError("offset must be >= 0.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        schedule_names = await schedule_name_map(conn)
        rows = await repository.list_job_runs(
            conn,
            status=status,
            task_name=task_name,
            schedule_id=schedule_id,
            triggered_by=triggered_by,
            limit=limit,
            offset=offset,
        )
    return [record_to_run(row, schedule_names=schedule_names) for row in rows]


async def get_job_run(run_id: UUID) -> JobRunPublic:
    """Fetch one job run by id."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.get_job_run_by_id(conn, run_id=run_id)
        if row is None:
            raise AppError("Job run not found.", status_code=404)
        schedule_names = await schedule_name_map(conn)
    return record_to_run(row, schedule_names=schedule_names)


async def delete_job_run(run_id: UUID) -> None:
    """Delete a job run history row."""
    pool = get_pool()
    async with pool.acquire() as conn:
        deleted = await repository.delete_job_run(conn, run_id=run_id)
    if not deleted:
        raise AppError("Job run not found.", status_code=404)
