# keel_api/src/modules/deleted/handlers/media.py
"""Trash handlers for media module entities."""

from __future__ import annotations

from uuid import UUID

from core.errors import AppError
from core.storage import get_storage_backend
from core.tables import MEDIA_ATTACHMENTS, MEDIA_FOLDERS, MEDIA_OBJECTS, MEDIA_PANEL_ITEMS, MEDIA_PANELS
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
from modules.media import repository


class MediaHandler:
    entity_type = entity_types.MEDIA

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        media_id = UUID(entity_id)
        row = await repository.get_media_object_for_user(conn, media_id, user_id)
        if row is None:
            raise AppError("Media not found.", status_code=404)
        attachment_count = await repository.count_attachments_for_media(conn, media_id)
        if attachment_count > 0:
            raise AppError(
                "Media is still attached to one or more entities.",
                status_code=409,
            )
        label = row.get("original_filename") or row.get("display_name") or str(media_id)
        return CaptureResult(
            display_label=str(label),
            payload={"media": record_to_dict(row)},
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        media_id = UUID(entity_id)
        row = await repository.get_media_object_for_user(conn, media_id, user_id)
        if row is None:
            raise AppError("Media not found.", status_code=404)
        deleted = await repository.delete_media_object(conn, media_id=media_id)
        if deleted is None:
            raise AppError("Media not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, MEDIA_OBJECTS, [payload["media"]], pk="id")
        return str(payload["media"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id
        storage_key = payload.get("media", {}).get("storage_key")
        if not storage_key:
            return
        backend = get_storage_backend()
        try:
            await backend.delete_object(storage_key)
        except AppError:
            pass


class MediaFolderHandler:
    entity_type = entity_types.MEDIA_FOLDER

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        folder_id = UUID(entity_id)
        row = await fetch_row(
            conn,
            MEDIA_FOLDERS,
            where_sql="id = $1 AND user_id = $2",
            params=(folder_id, user_id),
        )
        if row is None:
            raise AppError("Folder not found.", status_code=404)
        child_folders = await repository.count_child_folders(
            conn,
            user_id=user_id,
            folder_id=folder_id,
        )
        if child_folders > 0:
            raise AppError("Folder is not empty.", status_code=409)
        media_count = await repository.count_media_in_folder(
            conn,
            user_id=user_id,
            folder_id=folder_id,
        )
        if media_count > 0:
            raise AppError("Folder is not empty.", status_code=409)
        return CaptureResult(
            display_label=build_label(row, "name", fallback=f"Folder {entity_id}"),
            payload={"folder": record_to_dict(row)},
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        folder_id = UUID(entity_id)
        deleted = await repository.hard_delete_media_folder(
            conn,
            folder_id=folder_id,
            user_id=user_id,
        )
        if not deleted:
            raise AppError("Folder not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        folder = dict(payload["folder"])
        folder.pop("deleted_at", None)
        await restore_table_rows(conn, MEDIA_FOLDERS, [folder], pk="id")
        return str(folder["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class MediaAttachmentHandler:
    entity_type = entity_types.MEDIA_ATTACHMENT

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        del user_id
        attachment_id = int(entity_id)
        row = await repository.get_attachment(conn, attachment_id)
        if row is None:
            raise AppError("Attachment not found.", status_code=404)
        label = row.get("display_name") or f"Attachment {attachment_id}"
        return CaptureResult(
            display_label=str(label),
            payload={"attachment": record_to_dict(row)},
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        del user_id
        await repository.delete_attachment(conn, attachment_id=int(entity_id))

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, MEDIA_ATTACHMENTS, [payload["attachment"]])
        return str(payload["attachment"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class MediaPanelHandler:
    entity_type = entity_types.MEDIA_PANEL

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        panel_id = UUID(entity_id)
        row = await fetch_row(
            conn,
            MEDIA_PANELS,
            where_sql="id = $1 AND user_id = $2",
            params=(panel_id, user_id),
        )
        if row is None:
            raise AppError("Panel not found.", status_code=404)
        items = await fetch_rows(
            conn,
            MEDIA_PANEL_ITEMS,
            where_sql="panel_id = $1",
            params=(panel_id,),
        )
        return CaptureResult(
            display_label=build_label(row, "name", fallback=f"Panel {entity_id}"),
            payload={
                "panel": record_to_dict(row),
                "items": [record_to_dict(item) for item in items],
            },
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        panel_id = UUID(entity_id)
        await delete_rows(conn, MEDIA_PANEL_ITEMS, where_sql="panel_id = $1", params=(panel_id,))
        await repository.hard_delete_media_panel(conn, panel_id=panel_id, user_id=user_id)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        panel = dict(payload["panel"])
        panel.pop("deleted_at", None)
        await restore_table_rows(conn, MEDIA_PANELS, [panel], pk="id")
        await restore_table_rows(conn, MEDIA_PANEL_ITEMS, payload.get("items", []), pk="id")
        return str(panel["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class MediaPanelItemHandler:
    entity_type = entity_types.MEDIA_PANEL_ITEM

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        item_id = UUID(entity_id)
        row = await fetch_row(conn, MEDIA_PANEL_ITEMS, where_sql="id = $1", params=(item_id,))
        if row is None:
            raise AppError("Panel item not found.", status_code=404)
        panel = await fetch_row(
            conn,
            MEDIA_PANELS,
            where_sql="id = $1 AND user_id = $2",
            params=(row["panel_id"], user_id),
        )
        if panel is None:
            raise AppError("Panel item not found.", status_code=404)
        return CaptureResult(
            display_label=f"Panel tile {entity_id}",
            payload={"item": record_to_dict(row)},
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        del user_id
        await delete_rows(conn, MEDIA_PANEL_ITEMS, where_sql="id = $1", params=(UUID(entity_id),))

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, MEDIA_PANEL_ITEMS, [payload["item"]], pk="id")
        return str(payload["item"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


HANDLERS: tuple[DeletedEntityHandler, ...] = (
    MediaHandler(),
    MediaFolderHandler(),
    MediaAttachmentHandler(),
    MediaPanelHandler(),
    MediaPanelItemHandler(),
)
