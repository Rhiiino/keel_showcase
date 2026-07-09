# keel_api/src/modules/deleted/handlers/contacts.py
"""Trash handlers for contacts module entities."""

from __future__ import annotations

from core.errors import AppError
from core.tables import (
    CONTACT_RELATIONSHIPS,
    CONTACT_TAG_ASSIGNMENTS,
    CONTACT_TAGS,
    CONTACTS,
    MEDIA_ATTACHMENTS,
)
from modules.contacts import relationships_repository, repository, tags_repository
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


class ContactHandler:
    entity_type = entity_types.CONTACT

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        contact_id = int(entity_id)
        row = await repository.get_contact_by_id(conn, user_id, contact_id)
        if row is None:
            raise AppError("Contact not found.", status_code=404)
        if row["is_self"]:
            raise AppError("Cannot delete the self contact.", status_code=400)
        tag_assignments = await fetch_rows(
            conn,
            CONTACT_TAG_ASSIGNMENTS,
            where_sql="contact_id = $1",
            params=(contact_id,),
        )
        relationships = await fetch_rows(
            conn,
            CONTACT_RELATIONSHIPS,
            where_sql="user_id = $1 AND (from_contact_id = $2 OR to_contact_id = $2)",
            params=(user_id, contact_id),
        )
        attachments = await fetch_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'contact' AND entity_id = $1",
            params=(contact_id,),
        )
        label = build_label(row, "first_name", "last_name", fallback=f"Contact {contact_id}")
        return CaptureResult(
            display_label=label,
            payload={
                "contact": record_to_dict(row),
                "tag_assignments": [record_to_dict(r) for r in tag_assignments],
                "relationships": [record_to_dict(r) for r in relationships],
                "attachments": [record_to_dict(r) for r in attachments],
            },
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        contact_id = int(entity_id)
        await delete_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'contact' AND entity_id = $1",
            params=(contact_id,),
        )
        deleted = await repository.delete_contact(conn, user_id, contact_id)
        if not deleted:
            raise AppError("Contact not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, CONTACTS, [payload["contact"]])
        await restore_table_rows(conn, CONTACT_TAG_ASSIGNMENTS, payload.get("tag_assignments", []))
        await restore_table_rows(conn, CONTACT_RELATIONSHIPS, payload.get("relationships", []))
        await restore_table_rows(conn, MEDIA_ATTACHMENTS, payload.get("attachments", []))
        return str(payload["contact"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class ContactRelationshipHandler:
    entity_type = entity_types.CONTACT_RELATIONSHIP

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        relationship_id = int(entity_id)
        row = await relationships_repository.get_relationship_by_id(
            conn,
            user_id,
            relationship_id,
        )
        if row is None:
            raise AppError("Relationship not found.", status_code=404)
        return CaptureResult(
            display_label=f"Relationship {relationship_id}",
            payload={"relationship": record_to_dict(row)},
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        deleted = await relationships_repository.delete_relationship(
            conn,
            user_id,
            int(entity_id),
        )
        if not deleted:
            raise AppError("Relationship not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, CONTACT_RELATIONSHIPS, [payload["relationship"]])
        return str(payload["relationship"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class ContactTagHandler:
    entity_type = entity_types.CONTACT_TAG

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
        await restore_table_rows(conn, CONTACT_TAGS, [payload["tag"]])
        return str(payload["tag"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


HANDLERS: tuple[DeletedEntityHandler, ...] = (
    ContactHandler(),
    ContactRelationshipHandler(),
    ContactTagHandler(),
)
