# keel_api/src/modules/jobs/repository/runs.py
"""SQL access for background job run tracking."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any
from uuid import UUID

import asyncpg

from core.tables import JOB_RUNS

_RUN_COLUMNS = """
    id,
    celery_task_id,
    task_name,
    queue,
    status,
    triggered_by,
    user_id,
    schedule_id,
    payload,
    result,
    error,
    created_at,
    started_at,
    finished_at
"""



# ----- Inserts
async def insert_job_run(
    conn: asyncpg.Connection,
    *,
    run_id: UUID,
    celery_task_id: str,
    task_name: str,
    queue: str,
    triggered_by: str,
    user_id: int | None,
    payload: dict[str, Any],
    status: str = "pending",
    schedule_id: UUID | None = None,
) -> asyncpg.Record:
    """Insert a new job run row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {JOB_RUNS} (
            id,
            celery_task_id,
            task_name,
            queue,
            status,
            triggered_by,
            user_id,
            schedule_id,
            payload
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        RETURNING
            id,
            celery_task_id,
            task_name,
            queue,
            status,
            triggered_by,
            user_id,
            schedule_id,
            payload,
            result,
            error,
            created_at,
            started_at,
            finished_at
        """,
        run_id,
        celery_task_id,
        task_name,
        queue,
        status,
        triggered_by,
        user_id,
        schedule_id,
        json.dumps(payload),
    )
    if row is None:
        raise RuntimeError("Failed to insert job run.")
    return row



# ----- Reads
async def get_job_run_by_celery_task_id(
    conn: asyncpg.Connection,
    *,
    celery_task_id: str,
) -> asyncpg.Record | None:
    """Fetch one job run by Celery task id."""
    return await conn.fetchrow(
        f"""
        SELECT {_RUN_COLUMNS}
        FROM {JOB_RUNS}
        WHERE celery_task_id = $1
        """,
        celery_task_id,
    )


async def list_job_runs(
    conn: asyncpg.Connection,
    *,
    status: str | None = None,
    task_name: str | None = None,
    schedule_id: UUID | None = None,
    triggered_by: str | None = None,
    limit: int = 200,
    offset: int = 0,
) -> list[asyncpg.Record]:
    """List job runs with optional filters, newest first."""
    clauses = ["TRUE"]
    params: list[object] = []
    param_index = 1

    if status is not None:
        clauses.append(f"status = ${param_index}")
        params.append(status)
        param_index += 1
    if task_name is not None:
        clauses.append(f"task_name = ${param_index}")
        params.append(task_name)
        param_index += 1
    if schedule_id is not None:
        clauses.append(f"schedule_id = ${param_index}")
        params.append(schedule_id)
        param_index += 1
    if triggered_by is not None:
        clauses.append(f"triggered_by = ${param_index}")
        params.append(triggered_by)
        param_index += 1

    params.extend([limit, offset])
    where_sql = " AND ".join(clauses)
    return await conn.fetch(
        f"""
        SELECT {_RUN_COLUMNS}
        FROM {JOB_RUNS}
        WHERE {where_sql}
        ORDER BY created_at DESC
        LIMIT ${param_index} OFFSET ${param_index + 1}
        """,
        *params,
    )


async def get_job_run_by_id(
    conn: asyncpg.Connection,
    *,
    run_id: UUID,
) -> asyncpg.Record | None:
    """Fetch one job run by primary key."""
    return await conn.fetchrow(
        f"""
        SELECT {_RUN_COLUMNS}
        FROM {JOB_RUNS}
        WHERE id = $1
        """,
        run_id,
    )


async def count_job_runs_by_schedule(conn: asyncpg.Connection) -> dict[UUID, int]:
    """Return run totals keyed by schedule id."""
    rows = await conn.fetch(
        f"""
        SELECT schedule_id, COUNT(*)::int AS run_count
        FROM {JOB_RUNS}
        WHERE schedule_id IS NOT NULL
        GROUP BY schedule_id
        """
    )
    return {row["schedule_id"]: int(row["run_count"]) for row in rows}


async def last_finished_at_by_schedule(conn: asyncpg.Connection) -> dict[UUID, datetime]:
    """Return the latest finished_at per schedule for next-run estimation."""
    rows = await conn.fetch(
        f"""
        SELECT schedule_id, MAX(finished_at) AS last_finished_at
        FROM {JOB_RUNS}
        WHERE schedule_id IS NOT NULL
          AND finished_at IS NOT NULL
        GROUP BY schedule_id
        """
    )
    return {
        row["schedule_id"]: row["last_finished_at"]
        for row in rows
        if row["last_finished_at"] is not None
    }


async def count_job_runs_for_schedule(
    conn: asyncpg.Connection,
    *,
    schedule_id: UUID,
) -> int:
    """Return how many runs are linked to one schedule."""
    value = await conn.fetchval(
        f"""
        SELECT COUNT(*)::int
        FROM {JOB_RUNS}
        WHERE schedule_id = $1
        """,
        schedule_id,
    )
    return int(value or 0)



# ----- Deletes
async def delete_job_run(conn: asyncpg.Connection, *, run_id: UUID) -> bool:
    """Delete one job run row. Returns True when a row was removed."""
    result = await conn.execute(
        f"""
        DELETE FROM {JOB_RUNS}
        WHERE id = $1
        """,
        run_id,
    )
    return result.split()[-1] != "0"



# ----- Status updates
async def mark_job_run_running(
    conn: asyncpg.Connection,
    *,
    celery_task_id: str,
) -> None:
    """Mark a job run as running."""
    await conn.execute(
        f"""
        UPDATE {JOB_RUNS}
        SET
            status = 'running',
            started_at = COALESCE(started_at, NOW())
        WHERE celery_task_id = $1
        """,
        celery_task_id,
    )


async def mark_job_run_finished(
    conn: asyncpg.Connection,
    *,
    celery_task_id: str,
    status: str,
    result: dict[str, Any] | None = None,
    error: str | None = None,
) -> None:
    """Mark a job run as finished with success, failure, or retry status."""
    await conn.execute(
        f"""
        UPDATE {JOB_RUNS}
        SET
            status = $2,
            result = $3::jsonb,
            error = $4,
            finished_at = NOW()
        WHERE celery_task_id = $1
        """,
        celery_task_id,
        status,
        json.dumps(result) if result is not None else None,
        error,
    )


async def mark_job_run_retry(
    conn: asyncpg.Connection,
    *,
    celery_task_id: str,
    error: str | None = None,
) -> None:
    """Mark a job run as awaiting retry without closing the run."""
    await conn.execute(
        f"""
        UPDATE {JOB_RUNS}
        SET
            status = 'retry',
            error = $2,
            finished_at = NULL
        WHERE celery_task_id = $1
        """,
        celery_task_id,
        error,
    )
