# keel_api/src/modules/focus/service/tags.py

"""Focus tag CRUD."""

from __future__ import annotations

import asyncpg

from core.database import get_pool
from core.errors import AppError
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.focus.repository import tags as tags_repository
from modules.focus.schemas import FocusTagCreate, FocusTagPublic, FocusTagUpdate
from modules.focus.service.helpers import (
    normalize_tag_color,
    normalize_tag_name,
    record_to_tag,
)



async def list_focus_tags(user_id: int) -> list[FocusTagPublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await tags_repository.list_user_tags(conn, user_id)
    return [record_to_tag(row) for row in rows]


async def create_focus_tag(user_id: int, payload: FocusTagCreate) -> FocusTagPublic:
    name = normalize_tag_name(payload.name)
    color_hex = normalize_tag_color(payload.color_hex)
    pool = get_pool()
    async with pool.acquire() as conn:
        try:
            row = await tags_repository.insert_user_tag(
                conn,
                user_id=user_id,
                name=name,
                color_hex=color_hex,
            )
        except asyncpg.UniqueViolationError as exc:
            raise AppError("A tag with that name already exists.", status_code=400) from exc
    return record_to_tag(row)


async def update_focus_tag(
    user_id: int,
    tag_id: int,
    payload: FocusTagUpdate,
) -> FocusTagPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await tags_repository.get_user_tag(
            conn,
            user_id=user_id,
            tag_id=tag_id,
        )
        if existing is None:
            raise AppError("Focus tag not found.", status_code=404)
        name = normalize_tag_name(payload.name) if payload.name is not None else None
        color_hex = (
            normalize_tag_color(payload.color_hex)
            if payload.color_hex is not None
            else None
        )
        try:
            row = await tags_repository.update_user_tag(
                conn,
                user_id=user_id,
                tag_id=tag_id,
                name=name,
                color_hex=color_hex,
            )
        except asyncpg.UniqueViolationError as exc:
            raise AppError("A tag with that name already exists.", status_code=400) from exc
        if row is None:
            raise AppError("Focus tag not found.", status_code=404)
    return record_to_tag(row)


async def delete_focus_tag(user_id: int, tag_id: int) -> None:
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.FOCUS_TAG,
        str(tag_id),
    )
