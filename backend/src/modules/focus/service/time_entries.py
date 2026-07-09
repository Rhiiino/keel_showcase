# keel_api/src/modules/focus/service/time_entries.py

"""Focus node timer service actions."""

from __future__ import annotations

from datetime import datetime, timezone

import asyncpg

from core.database import get_pool
from core.errors import AppError
from modules.focus.repository import time_entries as time_entries_repository
from modules.focus.schemas import FocusNodeTimeEntryPublic, FocusNodeTimerStatePublic
from modules.focus.service.helpers import load_owned_node


def record_to_time_entry(row: asyncpg.Record) -> FocusNodeTimeEntryPublic:
    return FocusNodeTimeEntryPublic(
        id=int(row["id"]),
        user_id=int(row["user_id"]),
        node_id=int(row["node_id"]),
        status=row["status"],
        started_at=row["started_at"],
        last_paused_at=row["last_paused_at"],
        ended_at=row["ended_at"],
        accumulated_paused_seconds=int(row["accumulated_paused_seconds"]),
        duration_seconds=(
            int(row["duration_seconds"])
            if row["duration_seconds"] is not None
            else None
        ),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def compute_elapsed_seconds(entry: FocusNodeTimeEntryPublic | None) -> int:
    if entry is None:
        return 0
    if entry.status == "ended":
        return max(entry.duration_seconds or 0, 0)

    now = datetime.now(timezone.utc)
    active_until = entry.last_paused_at if entry.status == "paused" else now
    if active_until is None:
        active_until = now
    elapsed = (active_until - entry.started_at).total_seconds()
    return max(int(elapsed) - entry.accumulated_paused_seconds, 0)


def timer_state_from_entry(
    *,
    node_id: int,
    row: asyncpg.Record | None,
) -> FocusNodeTimerStatePublic:
    entry = record_to_time_entry(row) if row is not None else None
    return FocusNodeTimerStatePublic(
        node_id=node_id,
        active_entry=entry,
        elapsed_seconds=compute_elapsed_seconds(entry),
    )



# ----- Focus node timer actions
async def list_focus_node_time_entries(
    user_id: int,
    node_id: int,
) -> list[FocusNodeTimeEntryPublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        await load_owned_node(conn, user_id=user_id, node_id=node_id)
        rows = await time_entries_repository.list_node_time_entries(
            conn,
            user_id=user_id,
            node_id=node_id,
        )
    return [record_to_time_entry(row) for row in rows]


async def get_focus_node_timer_state(
    user_id: int,
    node_id: int,
) -> FocusNodeTimerStatePublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        await load_owned_node(conn, user_id=user_id, node_id=node_id)
        row = await time_entries_repository.get_open_time_entry(
            conn,
            user_id=user_id,
            node_id=node_id,
        )
    return timer_state_from_entry(node_id=node_id, row=row)


async def start_focus_node_timer(
    user_id: int,
    node_id: int,
) -> FocusNodeTimerStatePublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await load_owned_node(conn, user_id=user_id, node_id=node_id)
            existing = await time_entries_repository.get_open_time_entry(
                conn,
                user_id=user_id,
                node_id=node_id,
            )
            if existing is not None:
                raise AppError("A timer is already open for this focus node.", status_code=400)
            try:
                row = await time_entries_repository.insert_running_time_entry(
                    conn,
                    user_id=user_id,
                    node_id=node_id,
                )
            except asyncpg.UniqueViolationError as exc:
                raise AppError(
                    "A timer is already open for this focus node.",
                    status_code=400,
                ) from exc
    return timer_state_from_entry(node_id=node_id, row=row)


async def pause_focus_node_timer(
    user_id: int,
    node_id: int,
) -> FocusNodeTimerStatePublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await load_owned_node(conn, user_id=user_id, node_id=node_id)
            row = await time_entries_repository.pause_time_entry(
                conn,
                user_id=user_id,
                node_id=node_id,
            )
            if row is None:
                raise AppError("No running timer was found for this focus node.", status_code=400)
    return timer_state_from_entry(node_id=node_id, row=row)


async def resume_focus_node_timer(
    user_id: int,
    node_id: int,
) -> FocusNodeTimerStatePublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await load_owned_node(conn, user_id=user_id, node_id=node_id)
            row = await time_entries_repository.resume_time_entry(
                conn,
                user_id=user_id,
                node_id=node_id,
            )
            if row is None:
                raise AppError("No paused timer was found for this focus node.", status_code=400)
    return timer_state_from_entry(node_id=node_id, row=row)


async def end_focus_node_timer(
    user_id: int,
    node_id: int,
) -> FocusNodeTimerStatePublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await load_owned_node(conn, user_id=user_id, node_id=node_id)
            ended = await time_entries_repository.end_time_entry(
                conn,
                user_id=user_id,
                node_id=node_id,
            )
            if ended is None:
                raise AppError("No open timer was found for this focus node.", status_code=400)
    return FocusNodeTimerStatePublic(
        node_id=node_id,
        active_entry=None,
        elapsed_seconds=0,
    )
