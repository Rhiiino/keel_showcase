# keel_api/src/modules/media/access.py

"""Entity ownership checks for media access."""

from __future__ import annotations

import asyncpg

from core.errors import AppError
from core.tables import (
    CONTACTS,
    FIGURES,
    FINANCE_OBLIGATIONS,
    FINANCE_TRANSACTIONS,
    FINANCE_VENDORS,
    JOURNAL_ENTRIES,
    PROJECTS,
    TIMELINE_EVENTS,
)
from modules.media import config


async def assert_entity_owned_by_user(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    entity_type: str,
    entity_id: int,
) -> None:
    """Raise when the entity does not belong to the user."""
    if entity_type not in config.VALID_ENTITY_TYPES:
        raise AppError("Invalid entity type.", status_code=400)

    table_map = {
        "project": (PROJECTS, "user_id"),
        "finance_transaction": (FINANCE_TRANSACTIONS, "user_id"),
        "finance_obligation": (FINANCE_OBLIGATIONS, "user_id"),
        "finance_vendor": (FINANCE_VENDORS, "user_id"),
        "contact": (CONTACTS, "user_id"),
        "figure": (FIGURES, "user_id"),
        "timeline_event": (TIMELINE_EVENTS, "user_id"),
        "journal_entry": (JOURNAL_ENTRIES, "user_id"),
    }
    table, owner_column = table_map[entity_type]

    exists = await conn.fetchval(
        f"SELECT 1 FROM {table} WHERE id = $1 AND {owner_column} = $2",
        entity_id,
        user_id,
    )

    if not exists:
        raise AppError("Entity not found.", status_code=404)


async def assert_media_readable_by_user(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    media_id,
) -> asyncpg.Record:
    """Return the media row when the user owns it or can access an attached entity."""
    from uuid import UUID

    from core.tables import MEDIA_ATTACHMENTS, MEDIA_OBJECTS
    from modules.media.repository import _OBJECT_COLUMNS

    if isinstance(media_id, str):
        media_id = UUID(media_id)

    row = await conn.fetchrow(
        f"""
        SELECT {_OBJECT_COLUMNS}
        FROM {MEDIA_OBJECTS}
        WHERE id = $1 AND status = 'ready'
        """,
        media_id,
    )
    if row is None:
        raise AppError("Media not found.", status_code=404)

    if row["user_id"] == user_id:
        return row

    attached = await conn.fetchval(
        f"""
        SELECT 1
        FROM {MEDIA_ATTACHMENTS} ma
        LEFT JOIN {PROJECTS} p
            ON ma.entity_type = 'project' AND ma.entity_id = p.id
        LEFT JOIN {FINANCE_TRANSACTIONS} ft
            ON ma.entity_type = 'finance_transaction' AND ma.entity_id = ft.id
        LEFT JOIN {FINANCE_OBLIGATIONS} fo
            ON ma.entity_type = 'finance_obligation' AND ma.entity_id = fo.id
        LEFT JOIN {FINANCE_VENDORS} fv
            ON ma.entity_type = 'finance_vendor' AND ma.entity_id = fv.id
        LEFT JOIN {TIMELINE_EVENTS} te
            ON ma.entity_type = 'timeline_event' AND ma.entity_id = te.id
        LEFT JOIN {JOURNAL_ENTRIES} je
            ON ma.entity_type = 'journal_entry' AND ma.entity_id = je.id
        LEFT JOIN {CONTACTS} c
            ON ma.entity_type = 'contact' AND ma.entity_id = c.id
        LEFT JOIN {FIGURES} f
            ON ma.entity_type = 'figure' AND ma.entity_id = f.id
        WHERE ma.media_id = $1
          AND (
            (ma.entity_type = 'project' AND p.user_id = $2)
            OR (ma.entity_type = 'finance_transaction' AND ft.user_id = $2)
            OR (ma.entity_type = 'finance_obligation' AND fo.user_id = $2)
            OR (ma.entity_type = 'finance_vendor' AND fv.user_id = $2)
            OR (ma.entity_type = 'timeline_event' AND te.user_id = $2)
            OR (ma.entity_type = 'journal_entry' AND je.user_id = $2)
            OR (ma.entity_type = 'contact' AND c.user_id = $2)
            OR (ma.entity_type = 'figure' AND f.user_id = $2)
          )
        LIMIT 1
        """,
        media_id,
        user_id,
    )
    if not attached:
        raise AppError("Media not found.", status_code=404)
    return row
