# keel_api/src/modules/coak/service/tags.py

"""Business logic for Coak record tags."""

from __future__ import annotations

import asyncpg
from asyncpg.exceptions import UniqueViolationError

from core.database import get_pool
from core.errors import AppError
from modules.coak import config
from modules.coak.repository import tags as tags_repository
from modules.coak.schemas import CoakTagCreate, CoakTagPublic, CoakTagUpdate
from modules.coak.service.helpers import assert_owned_record, normalize_color_hex, normalize_name
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service



def _dedupe_tag_ids(tag_ids: list[int]) -> list[int]:
    seen: set[int] = set()
    deduped: list[int] = []
    for tag_id in tag_ids:
        if tag_id in seen:
            continue
        seen.add(tag_id)
        deduped.append(tag_id)
    return deduped


async def validate_coak_tag_ids(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
    tag_ids: list[int],
) -> list[int]:
    """Validate tag ids belong to the record and return deduped list."""
    deduped = _dedupe_tag_ids(tag_ids)
    if not deduped:
        return []

    owned_count = await tags_repository.count_owned_tags(
        conn,
        user_id=user_id,
        record_id=record_id,
        tag_ids=deduped,
    )
    if owned_count != len(deduped):
        raise AppError("One or more tags were not found.", status_code=400)
    return deduped


def _normalize_tag_description(description: str | None) -> str | None:
    if description is None:
        return None
    normalized = description.strip()
    if not normalized:
        return None
    if len(normalized) > 512:
        raise AppError("Tag description must be at most 512 characters.", status_code=400)
    return normalized



def tag_to_public(row: asyncpg.Record) -> CoakTagPublic:
    return CoakTagPublic(
        id=int(row["id"]),
        name=row["name"],
        description=row.get("description"),
        color_hex=row["color_hex"],
        item_count=int(row.get("item_count", 0)),
    )


async def list_tags(user_id: int, record_id: int) -> list[CoakTagPublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        await assert_owned_record(conn, user_id=user_id, record_id=record_id)
        rows = await tags_repository.list_record_tags(
            conn,
            user_id=user_id,
            record_id=record_id,
        )
    return [tag_to_public(row) for row in rows]


async def create_tag(
    user_id: int,
    record_id: int,
    payload: CoakTagCreate,
) -> CoakTagPublic:
    name = normalize_name(payload.name, field_name="Tag name")
    if len(name) > 80:
        raise AppError("Tag name must be at most 80 characters.", status_code=400)
    color_hex = normalize_color_hex(
        payload.color_hex,
        default=config.DEFAULT_ITEM_COLOR_HEX,
    )
    description = _normalize_tag_description(payload.description)

    pool = get_pool()
    async with pool.acquire() as conn:
        await assert_owned_record(conn, user_id=user_id, record_id=record_id)
        try:
            row = await tags_repository.insert_record_tag(
                conn,
                user_id=user_id,
                record_id=record_id,
                name=name,
                description=description,
                color_hex=color_hex,
            )
        except UniqueViolationError as exc:
            raise AppError("Tag name already exists.", status_code=409) from exc

    return tag_to_public(row)


async def update_tag(
    user_id: int,
    record_id: int,
    tag_id: int,
    payload: CoakTagUpdate,
) -> CoakTagPublic:
    color_hex = (
        normalize_color_hex(payload.color_hex, default=config.DEFAULT_ITEM_COLOR_HEX)
        if payload.color_hex is not None
        else None
    )

    pool = get_pool()
    async with pool.acquire() as conn:
        await assert_owned_record(conn, user_id=user_id, record_id=record_id)
        existing = await tags_repository.get_record_tag(
            conn,
            user_id=user_id,
            record_id=record_id,
            tag_id=tag_id,
        )
        if existing is None:
            raise AppError("Tag not found.", status_code=404)

        resolved_name = (
            normalize_name(payload.name, field_name="Tag name")
            if payload.name is not None
            else existing["name"]
        )
        if len(resolved_name) > 80:
            raise AppError("Tag name must be at most 80 characters.", status_code=400)
        resolved_color = (
            color_hex if payload.color_hex is not None else existing["color_hex"]
        )
        resolved_description = (
            _normalize_tag_description(payload.description)
            if "description" in payload.model_fields_set
            else existing.get("description")
        )

        try:
            row = await tags_repository.update_record_tag(
                conn,
                user_id=user_id,
                record_id=record_id,
                tag_id=tag_id,
                name=resolved_name,
                description=resolved_description,
                color_hex=resolved_color,
            )
        except UniqueViolationError as exc:
            raise AppError("Tag name already exists.", status_code=409) from exc

        if row is None:
            raise AppError("Tag not found.", status_code=404)

    return tag_to_public(row)


async def delete_tag(user_id: int, record_id: int, tag_id: int) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        await assert_owned_record(conn, user_id=user_id, record_id=record_id)
        existing = await tags_repository.get_record_tag(
            conn,
            user_id=user_id,
            record_id=record_id,
            tag_id=tag_id,
        )
        if existing is None:
            raise AppError("Tag not found.", status_code=404)

    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.COAK_TAG,
        str(tag_id),
    )
