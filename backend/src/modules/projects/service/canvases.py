# keel_api/src/modules/projects/service/canvases.py

"""Business logic for project workspace canvases."""

from __future__ import annotations

import asyncpg
from asyncpg.exceptions import UniqueViolationError

from core.database import get_pool
from core.errors import AppError
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.projects.repository import canvas_repository, repository
from modules.projects.schemas import (
    ProjectCanvasCreate,
    ProjectCanvasPublic,
    ProjectCanvasUpdate,
)

from .projects import DEFAULT_WORKSPACE_STATE



# ----- Mapping helpers
def _record_to_canvas(row: asyncpg.Record) -> ProjectCanvasPublic:
    """Map a project_canvas row to ProjectCanvasPublic."""
    return ProjectCanvasPublic(
        canvas_id=row["canvas_id"],
        project_id=row["project_id"],
        name=row["name"],
        sort_order=row["sort_order"],
        is_default=row["is_default"],
        updated_at=row["updated_at"],
    )



# ----- Ownership helpers
async def _get_owned_project_row(
    conn: asyncpg.Connection,
    user_id: int,
    project_id: int,
) -> asyncpg.Record:
    row = await repository.get_project(conn, project_id)
    if row is None or row["user_id"] != user_id:
        raise AppError("Project not found.", status_code=404)
    return row


async def _get_owned_canvas_row(
    conn: asyncpg.Connection,
    user_id: int,
    project_id: int,
    canvas_id: int,
) -> asyncpg.Record:
    await _get_owned_project_row(conn, user_id, project_id)
    row = await canvas_repository.get_canvas_by_id(
        conn,
        project_id=project_id,
        canvas_id=canvas_id,
    )
    if row is None:
        raise AppError("Canvas not found.", status_code=404)
    return row


def _normalize_canvas_name(name: str) -> str:
    trimmed = name.strip()
    if not trimmed:
        raise AppError("Canvas name is required.", status_code=400)
    if len(trimmed) > 200:
        raise AppError("Canvas name must be at most 200 characters.", status_code=400)
    return trimmed



# ----- Default canvas
async def ensure_default_canvas(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    project_id: int,
) -> asyncpg.Record:
    """Ensure the project has a default canvas row and return it."""
    row = await canvas_repository.get_default_canvas_by_project_id(conn, project_id)
    if row is not None:
        return row

    count = await canvas_repository.count_canvases_by_project_id(conn, project_id)
    if count > 0:
        rows = await canvas_repository.list_canvases_by_project_id(conn, project_id)
        if not rows:
            raise AppError("Canvas not found.", status_code=404)
        first = rows[0]
        await canvas_repository.clear_default_canvas(
            conn,
            project_id,
            except_canvas_id=first["canvas_id"],
        )
        updated = await canvas_repository.update_canvas(
            conn,
            project_id=project_id,
            canvas_id=first["canvas_id"],
            is_default=True,
        )
        if updated is None:
            raise AppError("Canvas not found.", status_code=404)
        return updated

    return await canvas_repository.create_canvas(
        conn,
        project_id=project_id,
        user_id=user_id,
        name="Main",
        sort_order=0,
        is_default=True,
        state=dict(DEFAULT_WORKSPACE_STATE),
    )


async def resolve_default_canvas_id(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    project_id: int,
) -> int:
    """Return the default canvas id for a project, creating one when missing."""
    row = await ensure_default_canvas(
        conn,
        user_id=user_id,
        project_id=project_id,
    )
    return int(row["canvas_id"])



# ----- Canvas CRUD
async def list_project_canvases(
    user_id: int,
    project_id: int,
) -> list[ProjectCanvasPublic]:
    """List canvases for a project, ensuring a default exists."""
    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_project_row(conn, user_id, project_id)
        await ensure_default_canvas(conn, user_id=user_id, project_id=project_id)
        rows = await canvas_repository.list_canvases_by_project_id(conn, project_id)
    return [_record_to_canvas(row) for row in rows]


async def create_project_canvas(
    user_id: int,
    project_id: int,
    payload: ProjectCanvasCreate,
) -> ProjectCanvasPublic:
    """Create a new canvas for a project."""
    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_project_row(conn, user_id, project_id)
        await ensure_default_canvas(conn, user_id=user_id, project_id=project_id)

        existing = await canvas_repository.list_canvases_by_project_id(conn, project_id)
        if payload.name is None:
            name = f"Canvas {len(existing) + 1}"
        else:
            name = _normalize_canvas_name(payload.name)

        sort_order = await canvas_repository.get_max_sort_order(conn, project_id) + 1
        row = await canvas_repository.create_canvas(
            conn,
            project_id=project_id,
            user_id=user_id,
            name=name,
            sort_order=sort_order,
            is_default=False,
            state=dict(DEFAULT_WORKSPACE_STATE),
        )
    return _record_to_canvas(row)


async def update_project_canvas(
    user_id: int,
    project_id: int,
    canvas_id: int,
    payload: ProjectCanvasUpdate,
) -> ProjectCanvasPublic:
    """Update canvas metadata."""
    if (
        payload.name is None
        and payload.sort_order is None
        and payload.is_default is None
    ):
        raise AppError("No canvas fields to update.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_canvas_row(conn, user_id, project_id, canvas_id)

        name = None
        if payload.name is not None:
            name = _normalize_canvas_name(payload.name)

        if payload.is_default is True:
            await canvas_repository.clear_default_canvas(conn, project_id)

        try:
            updated = await canvas_repository.update_canvas(
                conn,
                project_id=project_id,
                canvas_id=canvas_id,
                name=name,
                sort_order=payload.sort_order,
                is_default=payload.is_default,
            )
        except UniqueViolationError as exc:
            raise AppError(
                "Project already has a default canvas.",
                status_code=409,
            ) from exc

        if updated is None:
            raise AppError("Canvas not found.", status_code=404)

        if payload.is_default is True:
            await canvas_repository.clear_default_canvas(
                conn,
                project_id,
                except_canvas_id=canvas_id,
            )

        if payload.is_default is False:
            default_row = await canvas_repository.get_default_canvas_by_project_id(
                conn,
                project_id,
            )
            if default_row is None:
                promoted = await canvas_repository.update_canvas(
                    conn,
                    project_id=project_id,
                    canvas_id=canvas_id,
                    is_default=True,
                )
                if promoted is None:
                    raise AppError("Canvas not found.", status_code=404)
                updated = promoted

    return _record_to_canvas(updated)


async def delete_project_canvas(
    user_id: int,
    project_id: int,
    canvas_id: int,
) -> None:
    """Delete one canvas when at least one other remains."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await _get_owned_canvas_row(conn, user_id, project_id, canvas_id)
        count = await canvas_repository.count_canvases_by_project_id(conn, project_id)
        if count <= 1:
            raise AppError("Cannot delete the last canvas.", status_code=400)
        if row["is_default"]:
            remaining = await canvas_repository.list_canvases_by_project_id(
                conn,
                project_id,
            )
            next_canvas = next(
                (canvas for canvas in remaining if canvas["canvas_id"] != canvas_id),
                None,
            )
            if next_canvas is not None:
                await canvas_repository.clear_default_canvas(conn, project_id)
                await canvas_repository.update_canvas(
                    conn,
                    project_id=project_id,
                    canvas_id=next_canvas["canvas_id"],
                    is_default=True,
                )
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.PROJECT_CANVAS,
        str(canvas_id),
    )
