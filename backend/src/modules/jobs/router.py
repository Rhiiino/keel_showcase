# keel_api/src/modules/jobs/router.py
"""HTTP routes for background job runs and schedules."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.jobs import config
from modules.jobs.service import runs, schedules, tasks
from modules.jobs.schemas import (
    JobRunPublic,
    JobScheduleCreate,
    JobSchedulePublic,
    JobScheduleUpdate,
    JobTaskPublic,
    SchedulableTaskOption,
)

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]



# ----- Job runs
@router.get(config.RUNS_PATH, response_model=list[JobRunPublic])
async def list_job_runs(
    user: CurrentUser,
    status: str | None = Query(default=None),
    task_name: str | None = Query(default=None),
    schedule_id: UUID | None = Query(default=None),
    triggered_by: str | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[JobRunPublic]:
    """List background job run history."""
    del user
    return await runs.list_job_runs(
        status=status,
        task_name=task_name,
        schedule_id=schedule_id,
        triggered_by=triggered_by,
        limit=limit,
        offset=offset,
    )


@router.get(config.RUN_BY_ID_PATH, response_model=JobRunPublic)
async def get_job_run(user: CurrentUser, run_id: UUID) -> JobRunPublic:
    """Fetch one job run."""
    del user
    return await runs.get_job_run(run_id)


@router.delete(config.RUN_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_job_run(user: CurrentUser, run_id: UUID) -> None:
    """Delete a job run history row."""
    del user
    await runs.delete_job_run(run_id)



# ----- Registered tasks
@router.get(config.TASKS_PATH, response_model=list[JobTaskPublic])
async def list_registered_tasks(user: CurrentUser) -> list[JobTaskPublic]:
    """List registered background tasks and their static metadata."""
    del user
    return await tasks.list_registered_tasks()



# ----- Job schedules
@router.get(config.SCHEDULE_TASK_OPTIONS_PATH, response_model=list[SchedulableTaskOption])
async def list_schedulable_task_options(user: CurrentUser) -> list[SchedulableTaskOption]:
    """List tasks that may be added to a schedule."""
    del user
    return await schedules.list_schedulable_task_options()


@router.get(config.SCHEDULES_PATH, response_model=list[JobSchedulePublic])
async def list_job_schedules(user: CurrentUser) -> list[JobSchedulePublic]:
    """List configured recurring schedules."""
    del user
    return await schedules.list_job_schedules()


@router.post(
    config.SCHEDULES_PATH,
    response_model=JobSchedulePublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_job_schedule(
    payload: JobScheduleCreate,
    user: CurrentUser,
) -> JobSchedulePublic:
    """Create a recurring schedule."""
    del user
    return await schedules.create_job_schedule(payload)


@router.get(config.SCHEDULE_BY_ID_PATH, response_model=JobSchedulePublic)
async def get_job_schedule(user: CurrentUser, schedule_id: UUID) -> JobSchedulePublic:
    """Fetch one schedule."""
    del user
    return await schedules.get_job_schedule(schedule_id)


@router.patch(config.SCHEDULE_BY_ID_PATH, response_model=JobSchedulePublic)
async def update_job_schedule(
    schedule_id: UUID,
    payload: JobScheduleUpdate,
    user: CurrentUser,
) -> JobSchedulePublic:
    """Update a schedule."""
    del user
    return await schedules.update_job_schedule(schedule_id, payload)


@router.delete(config.SCHEDULE_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_job_schedule(user: CurrentUser, schedule_id: UUID) -> None:
    """Delete a schedule."""
    del user
    await schedules.delete_job_schedule(schedule_id)


@router.post(config.SCHEDULE_RUN_PATH, response_model=JobRunPublic, status_code=status.HTTP_202_ACCEPTED)
async def run_job_schedule_now(user: CurrentUser, schedule_id: UUID) -> JobRunPublic:
    """Enqueue a schedule's task immediately."""
    return await schedules.run_schedule_now(schedule_id, user_id=user.id)
