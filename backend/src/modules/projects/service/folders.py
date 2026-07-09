# keel_api/src/modules/projects/service/folders.py

"""Business logic for project-scoped file folders."""

from __future__ import annotations

from uuid import UUID, uuid4

import asyncpg
from asyncpg.exceptions import UniqueViolationError

from core.database import get_pool
from core.errors import AppError
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.projects import config
from modules.projects.repository import folders_repository, repository
from modules.projects.schemas import (
    ProjectFolderCreate,
    ProjectFolderPublic,
    ProjectFolderUpdate,
)

MAX_FOLDER_DEPTH = 20
MAX_FOLDER_NAME_LENGTH = 200



# ----- Mapping helpers
def _record_to_folder(row: asyncpg.Record) -> ProjectFolderPublic:
    """Map a project_folders row to ProjectFolderPublic."""
    return ProjectFolderPublic(
        id=row["id"],
        project_id=row["project_id"],
        user_id=row["user_id"],
        parent_folder_id=row["parent_folder_id"],
        name=row["name"],
        sort_order=row["sort_order"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )



# ----- Folder helpers
async def _get_owned_project_row(
    conn: asyncpg.Connection,
    user_id: int,
    project_id: int,
) -> asyncpg.Record:
    row = await repository.get_project(conn, project_id)
    if row is None or row["user_id"] != user_id:
        raise AppError("Project not found.", status_code=404)
    return row


async def _assert_owned_folder(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    folder_id: UUID,
) -> asyncpg.Record:
    row = await folders_repository.get_project_folder(
        conn,
        folder_id=folder_id,
        project_id=project_id,
    )
    if row is None:
        raise AppError("Folder not found.", status_code=404)
    return row


async def _folder_depth(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    folder_id: UUID | None,
) -> int:
    depth = 0
    current = folder_id
    while current is not None:
        depth += 1
        if depth > MAX_FOLDER_DEPTH:
            break
        current = await folders_repository.get_project_folder_parent_id(
            conn,
            project_id=project_id,
            folder_id=current,
        )
    return depth


async def _would_create_folder_cycle(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    folder_id: UUID,
    new_parent_id: UUID,
) -> bool:
    if folder_id == new_parent_id:
        return True
    current: UUID | None = new_parent_id
    depth = 0
    while current is not None:
        if current == folder_id:
            return True
        depth += 1
        if depth > MAX_FOLDER_DEPTH:
            break
        current = await folders_repository.get_project_folder_parent_id(
            conn,
            project_id=project_id,
            folder_id=current,
        )
    return False


async def _validate_parent_folder(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    parent_folder_id: UUID | None,
) -> None:
    if parent_folder_id is None:
        return
    await _assert_owned_folder(
        conn,
        project_id=project_id,
        folder_id=parent_folder_id,
    )
    depth = await _folder_depth(
        conn,
        project_id=project_id,
        folder_id=parent_folder_id,
    )
    if depth >= MAX_FOLDER_DEPTH:
        raise AppError("Maximum folder depth exceeded.", status_code=400)


async def assert_project_folder_for_attachment(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    project_folder_id: UUID,
) -> None:
    """Verify a folder belongs to the given project."""
    await _assert_owned_folder(
        conn,
        project_id=project_id,
        folder_id=project_folder_id,
    )



# ----- Folder CRUD
async def list_project_folders(
    user_id: int,
    project_id: int,
    *,
    parent_folder_id: UUID | None = None,
    all_folders: bool = False,
) -> list[ProjectFolderPublic]:
    """List folders at one parent scope, or all folders for a project."""
    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_project_row(conn, user_id, project_id)
        if all_folders:
            rows = await folders_repository.list_project_folders_for_project(
                conn,
                project_id,
            )
            return [_record_to_folder(row) for row in rows]
        if parent_folder_id is not None:
            await _assert_owned_folder(
                conn,
                project_id=project_id,
                folder_id=parent_folder_id,
            )
        rows = await folders_repository.list_project_folders_for_parent(
            conn,
            project_id,
            parent_folder_id=parent_folder_id,
        )
    return [_record_to_folder(row) for row in rows]


async def create_project_folder(
    user_id: int,
    project_id: int,
    payload: ProjectFolderCreate,
) -> ProjectFolderPublic:
    """Create a folder under a parent or at the project root."""
    name = payload.name.strip()
    if not name:
        raise AppError("Folder name is required.", status_code=400)
    if len(name) > MAX_FOLDER_NAME_LENGTH:
        raise AppError("Folder name is too long.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await _get_owned_project_row(conn, user_id, project_id)
            await _validate_parent_folder(
                conn,
                project_id=project_id,
                parent_folder_id=payload.parent_folder_id,
            )
            try:
                row = await folders_repository.insert_project_folder(
                    conn,
                    folder_id=uuid4(),
                    project_id=project_id,
                    user_id=user_id,
                    name=name,
                    parent_folder_id=payload.parent_folder_id,
                )
            except UniqueViolationError as exc:
                raise AppError(
                    "A folder with that name already exists here.",
                    status_code=409,
                ) from exc
    return _record_to_folder(row)


async def update_project_folder(
    user_id: int,
    project_id: int,
    folder_id: UUID,
    payload: ProjectFolderUpdate,
) -> ProjectFolderPublic:
    """Rename, reorder, or move a project folder."""
    if (
        payload.name is None
        and payload.sort_order is None
        and "parent_folder_id" not in payload.model_fields_set
    ):
        raise AppError("No changes provided.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await _get_owned_project_row(conn, user_id, project_id)
            row = await _assert_owned_folder(
                conn,
                project_id=project_id,
                folder_id=folder_id,
            )
            updated = row

            if payload.name is not None:
                name = payload.name.strip()
                if not name:
                    raise AppError("Folder name is required.", status_code=400)
                try:
                    renamed = await folders_repository.update_project_folder_name(
                        conn,
                        folder_id=folder_id,
                        name=name,
                    )
                except UniqueViolationError as exc:
                    raise AppError(
                        "A folder with that name already exists here.",
                        status_code=409,
                    ) from exc
                if renamed is None:
                    raise AppError("Failed to update folder.", status_code=500)
                updated = renamed

            if payload.sort_order is not None:
                reordered = await folders_repository.update_project_folder_sort_order(
                    conn,
                    folder_id=folder_id,
                    sort_order=payload.sort_order,
                )
                if reordered is None:
                    raise AppError("Failed to update folder.", status_code=500)
                updated = reordered

            if "parent_folder_id" in payload.model_fields_set:
                new_parent_id = payload.parent_folder_id
                if new_parent_id is not None:
                    await _validate_parent_folder(
                        conn,
                        project_id=project_id,
                        parent_folder_id=new_parent_id,
                    )
                    if await _would_create_folder_cycle(
                        conn,
                        project_id=project_id,
                        folder_id=folder_id,
                        new_parent_id=new_parent_id,
                    ):
                        raise AppError("Folder cannot be moved into itself.", status_code=400)
                    parent_depth = await _folder_depth(
                        conn,
                        project_id=project_id,
                        folder_id=new_parent_id,
                    )
                    if parent_depth >= MAX_FOLDER_DEPTH:
                        raise AppError("Maximum folder depth exceeded.", status_code=400)
                moved = await folders_repository.update_project_folder_parent(
                    conn,
                    folder_id=folder_id,
                    parent_folder_id=new_parent_id,
                )
                if moved is None:
                    raise AppError("Failed to move folder.", status_code=500)
                updated = moved
    return _record_to_folder(updated)


async def delete_project_folder(
    user_id: int,
    project_id: int,
    folder_id: UUID,
) -> None:
    """Delete an empty project folder via recently-deleted trash."""
    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_project_row(conn, user_id, project_id)
        await _assert_owned_folder(
            conn,
            project_id=project_id,
            folder_id=folder_id,
        )
        child_folders = await folders_repository.count_child_project_folders(
            conn,
            project_id=project_id,
            folder_id=folder_id,
        )
        if child_folders > 0:
            raise AppError("Folder is not empty.", status_code=409)
        attachment_count = (
            await folders_repository.count_gallery_attachments_in_project_folder(
                conn,
                project_id=project_id,
                folder_id=folder_id,
            )
        )
        if attachment_count > 0:
            raise AppError("Folder is not empty.", status_code=409)
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.PROJECT_FOLDER,
        str(folder_id),
    )
