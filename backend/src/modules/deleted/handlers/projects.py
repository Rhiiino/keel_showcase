# keel_api/src/modules/deleted/handlers/projects.py
"""Trash handlers for projects module entities."""

from __future__ import annotations

from uuid import UUID

from core.errors import AppError
from core.tables import (
    MEDIA_ATTACHMENTS,
    PROJECT_CANVAS,
    PROJECT_FOLDERS,
    PROJECT_TAG_ASSIGNMENTS,
    PROJECT_TAGS,
    PROJECTS,
)
from modules.deleted import entity_types
from modules.deleted.handlers._protocol import CaptureResult, DeletedEntityHandler
from modules.deleted.handlers._utils import (
    build_label,
    delete_rows,
    fetch_row,
    fetch_rows,
    record_to_dict,
    restore_table_rows,
)
from modules.projects.repository import canvas as canvas_repository
from modules.projects.repository import folders as folders_repository
from modules.projects.repository import projects as projects_repository
from modules.projects.repository import tags as tags_repository


class ProjectHandler:
    entity_type = entity_types.PROJECT

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        project_id = int(entity_id)
        row = await projects_repository.get_project(conn, project_id=project_id)
        if row is None or row["user_id"] != user_id:
            raise AppError("Project not found.", status_code=404)
        tag_assignments = await fetch_rows(
            conn,
            PROJECT_TAG_ASSIGNMENTS,
            where_sql="project_id = $1",
            params=(project_id,),
        )
        canvas_rows = await fetch_rows(
            conn,
            PROJECT_CANVAS,
            where_sql="project_id = $1",
            params=(project_id,),
        )
        folder_rows = await fetch_rows(
            conn,
            PROJECT_FOLDERS,
            where_sql="project_id = $1",
            params=(project_id,),
        )
        attachments = await fetch_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'project' AND entity_id = $1",
            params=(project_id,),
        )
        return CaptureResult(
            display_label=build_label(row, "title", fallback=f"Project {project_id}"),
            payload={
                "project": record_to_dict(row),
                "tag_assignments": [record_to_dict(r) for r in tag_assignments],
                "canvas_rows": [record_to_dict(r) for r in canvas_rows],
                "folders": [record_to_dict(r) for r in folder_rows],
                "attachments": [record_to_dict(r) for r in attachments],
            },
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        del user_id
        project_id = int(entity_id)
        await delete_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'project' AND entity_id = $1",
            params=(project_id,),
        )
        deleted = await projects_repository.delete_project(conn, project_id=project_id)
        if not deleted:
            raise AppError("Project not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, PROJECTS, [payload["project"]])
        await restore_table_rows(
            conn,
            PROJECT_TAG_ASSIGNMENTS,
            payload.get("tag_assignments", []),
        )
        await restore_table_rows(conn, PROJECT_CANVAS, payload.get("canvas_rows", []))
        folders = [dict(row) for row in payload.get("folders", [])]
        for folder in folders:
            folder.pop("deleted_at", None)
        await restore_table_rows(conn, PROJECT_FOLDERS, folders, pk="id")
        await restore_table_rows(conn, MEDIA_ATTACHMENTS, payload.get("attachments", []))
        return str(payload["project"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class ProjectTagHandler:
    entity_type = entity_types.PROJECT_TAG

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        tag_id = int(entity_id)
        row = await tags_repository.get_user_tag(conn, user_id=user_id, tag_id=tag_id)
        if row is None:
            raise AppError("Tag not found.", status_code=404)
        return CaptureResult(
            display_label=row["name"],
            payload={"tag": record_to_dict(row)},
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        deleted = await tags_repository.delete_user_tag(
            conn,
            user_id=user_id,
            tag_id=int(entity_id),
        )
        if not deleted:
            raise AppError("Tag not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, PROJECT_TAGS, [payload["tag"]])
        return str(payload["tag"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class ProjectCanvasHandler:
    entity_type = entity_types.PROJECT_CANVAS

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        canvas_id = int(entity_id)
        row = await fetch_row(conn, PROJECT_CANVAS, where_sql="id = $1", params=(canvas_id,))
        if row is None:
            raise AppError("Canvas not found.", status_code=404)
        project = await projects_repository.get_project(conn, row["project_id"])
        if project is None or project["user_id"] != user_id:
            raise AppError("Canvas not found.", status_code=404)
        return CaptureResult(
            display_label=row.get("name") or f"Canvas {canvas_id}",
            payload={"canvas": record_to_dict(row)},
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        canvas_id = int(entity_id)
        row = await fetch_row(conn, PROJECT_CANVAS, where_sql="id = $1", params=(canvas_id,))
        if row is None:
            raise AppError("Canvas not found.", status_code=404)
        project = await projects_repository.get_project(conn, row["project_id"])
        if project is None or project["user_id"] != user_id:
            raise AppError("Canvas not found.", status_code=404)
        deleted = await canvas_repository.delete_canvas(
            conn,
            project_id=row["project_id"],
            canvas_id=canvas_id,
        )
        if not deleted:
            raise AppError("Canvas not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, PROJECT_CANVAS, [payload["canvas"]])
        return str(payload["canvas"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class ProjectFolderHandler:
    entity_type = entity_types.PROJECT_FOLDER

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        folder_id = UUID(entity_id)
        row = await fetch_row(
            conn,
            PROJECT_FOLDERS,
            where_sql="id = $1",
            params=(folder_id,),
        )
        if row is None:
            raise AppError("Folder not found.", status_code=404)
        project = await projects_repository.get_project(conn, project_id=row["project_id"])
        if project is None or project["user_id"] != user_id:
            raise AppError("Folder not found.", status_code=404)
        return CaptureResult(
            display_label=build_label(row, "name", fallback=f"Folder {entity_id}"),
            payload={"folder": record_to_dict(row)},
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        del user_id
        deleted = await folders_repository.hard_delete_project_folder(
            conn,
            folder_id=UUID(entity_id),
        )
        if not deleted:
            raise AppError("Folder not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        folder = dict(payload["folder"])
        folder.pop("deleted_at", None)
        await restore_table_rows(conn, PROJECT_FOLDERS, [folder], pk="id")
        return str(folder["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


HANDLERS: tuple[DeletedEntityHandler, ...] = (
    ProjectHandler(),
    ProjectTagHandler(),
    ProjectCanvasHandler(),
    ProjectFolderHandler(),
)
