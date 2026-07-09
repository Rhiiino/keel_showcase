# keel_api/src/modules/deleted/handlers/coak.py
"""Trash handlers for coak module entities."""

from __future__ import annotations

from uuid import UUID

from core.errors import AppError
from core.storage import get_storage_backend
from core.tables import COAK_ITEMS, COAK_RECORDS, COAK_TAGS, MEDIA_OBJECTS
from modules.coak.repository import items as items_repository
from modules.coak.repository import records as records_repository
from modules.coak.repository import tags as tags_repository
from modules.deleted import entity_types
from modules.deleted.handlers._protocol import CaptureResult, DeletedEntityHandler
from modules.deleted.handlers._utils import (
    build_label,
    fetch_row,
    record_to_dict,
    restore_table_rows,
)
from modules.media import repository as media_repository


async def _capture_coak_items(conn, *, user_id: int, record_id: int) -> list[dict]:
    rows = await items_repository.list_items_for_record(
        conn,
        user_id=user_id,
        record_id=record_id,
    )
    return [record_to_dict(row) for row in rows]


async def _capture_media_for_items(conn, items: list[dict]) -> list[dict]:
    media_ids = [
        UUID(str(item["media_id"]))
        for item in items
        if item.get("media_id")
    ]
    if not media_ids:
        return []
    rows = await conn.fetch(
        f"""
        SELECT * FROM {MEDIA_OBJECTS}
        WHERE id = ANY($1::uuid[])
        ORDER BY id
        """,
        media_ids,
    )
    return [record_to_dict(row) for row in rows]


async def _purge_media_payloads(media_rows: list[dict]) -> None:
    backend = get_storage_backend()
    for row in media_rows:
        storage_key = row.get("storage_key")
        if not storage_key:
            continue
        try:
            await backend.delete_object(storage_key)
        except AppError:
            pass


class CoakRecordHandler:
    entity_type = entity_types.COAK_RECORD

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        record_id = int(entity_id)
        row = await records_repository.get_record(
            conn,
            user_id=user_id,
            record_id=record_id,
        )
        if row is None:
            raise AppError("Coak record not found.", status_code=404)
        items = await _capture_coak_items(conn, user_id=user_id, record_id=record_id)
        media_rows = await _capture_media_for_items(conn, items)
        return CaptureResult(
            display_label=build_label(row, "name", fallback=f"Coak record {record_id}"),
            payload={
                "record": record_to_dict(row),
                "items": items,
                "media_objects": media_rows,
            },
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        record_id = int(entity_id)
        items = await _capture_coak_items(conn, user_id=user_id, record_id=record_id)
        media_rows = await _capture_media_for_items(conn, items)
        for media_row in media_rows:
            await media_repository.delete_media_object(conn, media_id=UUID(str(media_row["id"])))
        deleted = await records_repository.delete_record(
            conn,
            user_id=user_id,
            record_id=record_id,
        )
        if not deleted:
            raise AppError("Coak record not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, COAK_RECORDS, [payload["record"]])
        await restore_table_rows(conn, MEDIA_OBJECTS, payload.get("media_objects", []), pk="id")
        await restore_table_rows(conn, COAK_ITEMS, payload.get("items", []))
        return str(payload["record"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id
        await _purge_media_payloads(payload.get("media_objects", []))


class CoakItemHandler:
    entity_type = entity_types.COAK_ITEM

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        item_id = int(entity_id)
        row = await fetch_row(
            conn,
            COAK_ITEMS,
            where_sql="id = $1 AND user_id = $2",
            params=(item_id, user_id),
        )
        if row is None:
            raise AppError("Coak item not found.", status_code=404)
        record_id = int(row["coak_record_id"])
        target_ids = await items_repository.list_descendant_ids(
            conn,
            record_id=record_id,
            item_id=item_id,
        )
        all_items = await items_repository.list_items_for_record(
            conn,
            user_id=user_id,
            record_id=record_id,
        )
        captured_items = [
            record_to_dict(item)
            for item in all_items
            if int(item["id"]) in target_ids
        ]
        media_rows = await _capture_media_for_items(conn, captured_items)
        return CaptureResult(
            display_label=build_label(row, "name", fallback=f"Coak item {item_id}"),
            payload={
                "record_id": record_id,
                "items": captured_items,
                "media_objects": media_rows,
            },
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        item_id = int(entity_id)
        row = await fetch_row(
            conn,
            COAK_ITEMS,
            where_sql="id = $1 AND user_id = $2",
            params=(item_id, user_id),
        )
        if row is None:
            raise AppError("Coak item not found.", status_code=404)
        record_id = int(row["coak_record_id"])
        target_ids = await items_repository.list_descendant_ids(
            conn,
            record_id=record_id,
            item_id=item_id,
        )
        all_items = await items_repository.list_items_for_record(
            conn,
            user_id=user_id,
            record_id=record_id,
        )
        captured_items = [
            record_to_dict(item)
            for item in all_items
            if int(item["id"]) in target_ids
        ]
        media_rows = await _capture_media_for_items(conn, captured_items)
        for media_row in media_rows:
            await media_repository.delete_media_object(conn, media_id=UUID(str(media_row["id"])))
        deleted = await items_repository.delete_item(
            conn,
            user_id=user_id,
            record_id=record_id,
            item_id=item_id,
        )
        if deleted is None:
            raise AppError("Coak item not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, MEDIA_OBJECTS, payload.get("media_objects", []), pk="id")
        await restore_table_rows(conn, COAK_ITEMS, payload.get("items", []))
        root_id = payload.get("items", [{}])[0].get("id", "")
        return str(root_id)

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id
        await _purge_media_payloads(payload.get("media_objects", []))


class CoakTagHandler:
    entity_type = entity_types.COAK_TAG

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
        tag_id = int(entity_id)
        row = await tags_repository.get_user_tag(conn, user_id=user_id, tag_id=tag_id)
        if row is None:
            raise AppError("Tag not found.", status_code=404)
        deleted = await tags_repository.delete_record_tag(
            conn,
            user_id=user_id,
            record_id=int(row["coak_record_id"]),
            tag_id=tag_id,
        )
        if not deleted:
            raise AppError("Tag not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, COAK_TAGS, [payload["tag"]])
        return str(payload["tag"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


HANDLERS: tuple[DeletedEntityHandler, ...] = (
    CoakRecordHandler(),
    CoakItemHandler(),
    CoakTagHandler(),
)
