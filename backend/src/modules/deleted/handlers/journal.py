# keel_api/src/modules/deleted/handlers/journal.py
"""Trash handlers for journal module entities."""

from __future__ import annotations

from core.errors import AppError
from core.tables import (
    JOURNAL_ENTRIES,
    JOURNAL_ENTRY_TAG_ASSIGNMENTS,
    JOURNAL_TAGS,
    MEDIA_ATTACHMENTS,
)
from modules.deleted import entity_types
from modules.deleted.handlers._protocol import CaptureResult, DeletedEntityHandler
from modules.deleted.handlers._utils import (
    build_label,
    delete_rows,
    fetch_rows,
    record_to_dict,
    restore_table_rows,
)
from modules.journal.repository import entries as entries_repository
from modules.journal.repository import tags as tags_repository


class JournalEntryHandler:
    entity_type = entity_types.JOURNAL_ENTRY

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        entry_id = int(entity_id)
        row = await entries_repository.get_entry(conn, entry_id)
        if row is None or row["user_id"] != user_id:
            raise AppError("Journal entry not found.", status_code=404)
        tag_assignments = await fetch_rows(
            conn,
            JOURNAL_ENTRY_TAG_ASSIGNMENTS,
            where_sql="journal_entry_id = $1",
            params=(entry_id,),
        )
        attachments = await fetch_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'journal_entry' AND entity_id = $1",
            params=(entry_id,),
        )
        content = str(row["content"]).strip()
        preview = content[:80] + ("…" if len(content) > 80 else "")
        return CaptureResult(
            display_label=preview or f"Entry {entry_id}",
            payload={
                "entry": record_to_dict(row),
                "tag_assignments": [record_to_dict(r) for r in tag_assignments],
                "attachments": [record_to_dict(r) for r in attachments],
            },
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        del user_id
        entry_id = int(entity_id)
        await delete_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'journal_entry' AND entity_id = $1",
            params=(entry_id,),
        )
        deleted = await entries_repository.delete_entry(conn, entry_id)
        if deleted is None:
            raise AppError("Journal entry not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, JOURNAL_ENTRIES, [payload["entry"]])
        await restore_table_rows(
            conn,
            JOURNAL_ENTRY_TAG_ASSIGNMENTS,
            payload.get("tag_assignments", []),
        )
        await restore_table_rows(conn, MEDIA_ATTACHMENTS, payload.get("attachments", []))
        return str(payload["entry"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class JournalTagHandler:
    entity_type = entity_types.JOURNAL_TAG

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
        await restore_table_rows(conn, JOURNAL_TAGS, [payload["tag"]])
        return str(payload["tag"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


HANDLERS: tuple[DeletedEntityHandler, ...] = (
    JournalEntryHandler(),
    JournalTagHandler(),
)
