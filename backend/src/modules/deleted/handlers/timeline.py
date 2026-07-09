# keel_api/src/modules/deleted/handlers/timeline.py
"""Trash handlers for timeline module entities."""

from __future__ import annotations

from core.errors import AppError
from core.tables import (
    MEDIA_ATTACHMENTS,
    TIMELINE_EVENT_CONTACTS,
    TIMELINE_EVENT_REMINDERS,
    TIMELINE_TAG_ASSIGNMENTS,
    TIMELINE_EVENTS,
    TIMELINE_TAGS,
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
from modules.timeline.repository import events as events_repository
from modules.timeline.repository import tags as tags_repository


class TimelineEventHandler:
    entity_type = entity_types.TIMELINE_EVENT

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        event_id = int(entity_id)
        row = await events_repository.get_event(conn, event_id)
        if row is None or row["user_id"] != user_id:
            raise AppError("Timeline event not found.", status_code=404)
        contacts = await fetch_rows(
            conn,
            TIMELINE_EVENT_CONTACTS,
            where_sql="timeline_event_id = $1",
            params=(event_id,),
        )
        tag_assignments = await fetch_rows(
            conn,
            TIMELINE_TAG_ASSIGNMENTS,
            where_sql="timeline_event_id = $1",
            params=(event_id,),
        )
        reminders = await fetch_rows(
            conn,
            TIMELINE_EVENT_REMINDERS,
            where_sql="timeline_event_id = $1",
            params=(event_id,),
        )
        attachments = await fetch_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'timeline_event' AND entity_id = $1",
            params=(event_id,),
        )
        return CaptureResult(
            display_label=build_label(row, "description", fallback=f"Event {event_id}"),
            payload={
                "event": record_to_dict(row),
                "contacts": [record_to_dict(r) for r in contacts],
                "tag_assignments": [record_to_dict(r) for r in tag_assignments],
                "reminders": [record_to_dict(r) for r in reminders],
                "attachments": [record_to_dict(r) for r in attachments],
            },
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        del user_id
        event_id = int(entity_id)
        await delete_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'timeline_event' AND entity_id = $1",
            params=(event_id,),
        )
        deleted = await events_repository.delete_event(conn, event_id)
        if deleted is None:
            raise AppError("Timeline event not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, TIMELINE_EVENTS, [payload["event"]])
        await restore_table_rows(conn, TIMELINE_EVENT_CONTACTS, payload.get("contacts", []))
        await restore_table_rows(
            conn,
            TIMELINE_TAG_ASSIGNMENTS,
            payload.get("tag_assignments", []),
        )
        await restore_table_rows(conn, TIMELINE_EVENT_REMINDERS, payload.get("reminders", []))
        await restore_table_rows(conn, MEDIA_ATTACHMENTS, payload.get("attachments", []))
        return str(payload["event"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class TimelineTagHandler:
    entity_type = entity_types.TIMELINE_TAG

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
        await restore_table_rows(conn, TIMELINE_TAGS, [payload["tag"]])
        return str(payload["tag"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


HANDLERS: tuple[DeletedEntityHandler, ...] = (
    TimelineEventHandler(),
    TimelineTagHandler(),
)
