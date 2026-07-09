# keel_api/src/modules/journal/service.py

"""Business logic for journal entries."""

from __future__ import annotations

import re
from datetime import date

import asyncpg
from asyncpg.exceptions import UniqueViolationError

from core.database import get_pool
from core.errors import AppError
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.journal import config, repository
from modules.journal.schemas import (
    JournalEntryCreate,
    JournalEntryPublic,
    JournalEntryUpdate,
    JournalTagCreate,
    JournalTagPublic,
    JournalTagUpdate,
)



# ----- Record mappers
def _record_to_tag(row: asyncpg.Record) -> JournalTagPublic:
    """Map a database row to JournalTagPublic."""
    return JournalTagPublic(
        id=row["id"],
        name=row["name"],
        color_hex=row["color_hex"],
        entry_count=int(row.get("entry_count") or 0),
    )


def _record_to_entry(
    row: asyncpg.Record,
    *,
    tags: list[JournalTagPublic] | None = None,
) -> JournalEntryPublic:
    """Map a database row to JournalEntryPublic."""
    return JournalEntryPublic(
        id=row["id"],
        user_id=row["user_id"],
        entry_date=row["entry_date"],
        content=row["content"],
        tags=tags or [],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )



# ----- Validation helpers
def _normalize_tag_name(name: str) -> str:
    normalized = name.strip()
    if not normalized:
        raise AppError("Tag name is required.", status_code=400)
    if len(normalized) > 80:
        raise AppError("Tag name must be at most 80 characters.", status_code=400)
    return normalized


def _normalize_tag_color(color_hex: str | None) -> str:
    if color_hex is None:
        return config.DEFAULT_TAG_COLOR_HEX
    normalized = color_hex.strip()
    if not normalized:
        return config.DEFAULT_TAG_COLOR_HEX
    if re.fullmatch(r"#[0-9A-Fa-f]{6}", normalized) is None:
        raise AppError(
            "color_hex must be a valid 6-digit hex color like #06B6D4.",
            status_code=400,
        )
    return normalized.upper()


def _dedupe_tag_ids(tag_ids: list[int]) -> list[int]:
    seen: set[int] = set()
    deduped: list[int] = []
    for tag_id in tag_ids:
        if tag_id in seen:
            continue
        seen.add(tag_id)
        deduped.append(tag_id)
    return deduped


def _normalize_content(content: str) -> str:
    trimmed = content.strip()
    if not trimmed:
        raise AppError("Content is required.", status_code=400)
    return trimmed


async def _get_owned_entry_row(
    conn: asyncpg.Connection,
    user_id: int,
    entry_id: int,
) -> asyncpg.Record:
    row = await repository.get_entry(conn, entry_id)
    if row is None or row["user_id"] != user_id:
        raise AppError("Journal entry not found.", status_code=404)
    return row


async def _validate_journal_tag_ids(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_ids: list[int],
) -> list[int]:
    deduped = _dedupe_tag_ids(tag_ids)
    if not deduped:
        return []

    owned_count = await repository.count_owned_tags(
        conn,
        user_id=user_id,
        tag_ids=deduped,
    )
    if owned_count != len(deduped):
        raise AppError("One or more tags were not found.", status_code=400)
    return deduped


async def _tags_for_entry_rows(
    conn: asyncpg.Connection,
    rows: list[asyncpg.Record],
) -> dict[int, list[JournalTagPublic]]:
    entry_ids = [row["id"] for row in rows]
    grouped = await repository.fetch_tags_for_entries(conn, entry_ids)
    return {
        entry_id: [_record_to_tag(tag_row) for tag_row in tag_rows]
        for entry_id, tag_rows in grouped.items()
    }


async def _hydrate_entries(
    conn: asyncpg.Connection,
    rows: list[asyncpg.Record],
) -> list[JournalEntryPublic]:
    if not rows:
        return []

    tags_by_entry = await _tags_for_entry_rows(conn, rows)
    return [
        _record_to_entry(row, tags=tags_by_entry.get(row["id"], []))
        for row in rows
    ]



# ----- Journal tags
async def list_journal_tags(user_id: int) -> list[JournalTagPublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_user_tags(conn, user_id)
    return [_record_to_tag(row) for row in rows]


async def create_journal_tag(user_id: int, payload: JournalTagCreate) -> JournalTagPublic:
    name = _normalize_tag_name(payload.name)
    color_hex = _normalize_tag_color(payload.color_hex)

    pool = get_pool()
    async with pool.acquire() as conn:
        try:
            row = await repository.insert_user_tag(
                conn,
                user_id=user_id,
                name=name,
                color_hex=color_hex,
            )
        except UniqueViolationError as exc:
            raise AppError("Tag name already exists.", status_code=409) from exc

    return _record_to_tag(row)


async def update_journal_tag(
    user_id: int,
    tag_id: int,
    payload: JournalTagUpdate,
) -> JournalTagPublic:
    name = (
        _normalize_tag_name(payload.name)
        if payload.name is not None
        else None
    )
    color_hex = (
        _normalize_tag_color(payload.color_hex)
        if payload.color_hex is not None
        else None
    )

    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await repository.get_user_tag(conn, user_id=user_id, tag_id=tag_id)
        if existing is None:
            raise AppError("Tag not found.", status_code=404)

        resolved_name = name if name is not None else existing["name"]
        resolved_color = (
            color_hex if payload.color_hex is not None else existing["color_hex"]
        )

        try:
            row = await repository.update_user_tag(
                conn,
                user_id=user_id,
                tag_id=tag_id,
                name=resolved_name,
                color_hex=resolved_color,
            )
        except UniqueViolationError as exc:
            raise AppError("Tag name already exists.", status_code=409) from exc

        if row is None:
            raise AppError("Tag not found.", status_code=404)

    return _record_to_tag(row)


async def delete_journal_tag(user_id: int, tag_id: int) -> None:
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.JOURNAL_TAG,
        str(tag_id),
    )



# ----- Journal entries
async def list_entries(
    user_id: int,
    *,
    query: str | None = None,
    entry_date_from: date | None = None,
    entry_date_to: date | None = None,
    tag_ids: list[int] | None = None,
) -> list[JournalEntryPublic]:
    if (
        entry_date_from is not None
        and entry_date_to is not None
        and entry_date_from > entry_date_to
    ):
        raise AppError(
            "entry_date_from must be on or before entry_date_to.",
            status_code=400,
        )

    normalized_tag_ids = _dedupe_tag_ids(tag_ids or []) if tag_ids else None

    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_entries(
            conn,
            user_id,
            query=query,
            entry_date_from=entry_date_from,
            entry_date_to=entry_date_to,
            tag_ids=normalized_tag_ids,
        )
        return await _hydrate_entries(conn, rows)


async def get_entry(user_id: int, entry_id: int) -> JournalEntryPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await _get_owned_entry_row(conn, user_id, entry_id)
        tags_by_entry = await _tags_for_entry_rows(conn, [row])
        return _record_to_entry(row, tags=tags_by_entry.get(entry_id, []))


async def create_entry(
    user_id: int,
    payload: JournalEntryCreate,
) -> JournalEntryPublic:
    content = _normalize_content(payload.content)

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            tag_ids = await _validate_journal_tag_ids(
                conn,
                user_id=user_id,
                tag_ids=payload.tag_ids,
            )
            row = await repository.insert_entry(
                conn,
                user_id=user_id,
                entry_date=payload.entry_date,
                content=content,
            )
            if row is None:
                raise AppError("Failed to create journal entry.", status_code=500)
            await repository.replace_entry_tags(
                conn,
                entry_id=row["id"],
                tag_ids=tag_ids,
            )
            tags_by_entry = await _tags_for_entry_rows(conn, [row])
            return _record_to_entry(row, tags=tags_by_entry.get(row["id"], []))


async def update_entry(
    user_id: int,
    entry_id: int,
    payload: JournalEntryUpdate,
) -> JournalEntryPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            existing = await _get_owned_entry_row(conn, user_id, entry_id)

            entry_date = (
                payload.entry_date
                if payload.entry_date is not None
                else existing["entry_date"]
            )
            content = (
                _normalize_content(payload.content)
                if payload.content is not None
                else existing["content"]
            )

            row = await repository.update_entry(
                conn,
                entry_id,
                entry_date=entry_date,
                content=content,
            )
            if row is None:
                raise AppError("Journal entry not found.", status_code=404)

            if payload.tag_ids is not None:
                tag_ids = await _validate_journal_tag_ids(
                    conn,
                    user_id=user_id,
                    tag_ids=payload.tag_ids,
                )
                await repository.replace_entry_tags(
                    conn,
                    entry_id=entry_id,
                    tag_ids=tag_ids,
                )

            tags_by_entry = await _tags_for_entry_rows(conn, [row])
            return _record_to_entry(row, tags=tags_by_entry.get(entry_id, []))


async def delete_entry(user_id: int, entry_id: int) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_entry_row(conn, user_id, entry_id)
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.JOURNAL_ENTRY,
        str(entry_id),
    )
