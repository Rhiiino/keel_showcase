# keel_api/src/modules/coak/service/items.py

"""Business logic for Coak directory items."""

from __future__ import annotations

from uuid import UUID

import asyncpg
from asyncpg.exceptions import UniqueViolationError

from core.database import get_pool
from core.errors import AppError
from modules.coak import config
from modules.coak.repository import items as items_repository
from modules.coak.repository import tags as tags_repository
from modules.coak.schemas import CoakItemCreate, CoakItemPublic, CoakItemUpdate
from modules.coak.service.helpers import (
    assert_owned_record,
    item_to_public,
    normalize_color_hex,
    normalize_kind,
    normalize_name,
)
from modules.coak.service.tags import tag_to_public, validate_coak_tag_ids
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.media import service as media_service


_KIND_CREATE_DEFAULTS: dict[str, dict[str, str]] = {
    "folder": {},
    "note": {"note_body": ""},
    "flash": {"flash_front": "", "flash_back": ""},
}



async def list_items(user_id: int, record_id: int) -> list[CoakItemPublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        await assert_owned_record(conn, user_id=user_id, record_id=record_id)
        rows = await items_repository.list_items_for_record(
            conn,
            user_id=user_id,
            record_id=record_id,
        )
        item_ids = [int(row["id"]) for row in rows]
        tags_by_item = await tags_repository.fetch_tags_for_items(conn, item_ids)

    return [
        item_to_public(
            row,
            tags=[
                tag_to_public(tag_row)
                for tag_row in tags_by_item.get(int(row["id"]), [])
            ],
        )
        for row in rows
    ]


async def create_item(
    user_id: int,
    record_id: int,
    payload: CoakItemCreate,
) -> CoakItemPublic:
    kind = normalize_kind(payload.kind)
    name = normalize_name(payload.name)
    color_hex = normalize_color_hex(payload.color_hex)
    kind_defaults = _KIND_CREATE_DEFAULTS.get(kind, {})
    note_body = (
        payload.note_body
        if payload.note_body is not None
        else kind_defaults.get("note_body", "")
    )
    flash_front = (
        payload.flash_front
        if payload.flash_front is not None
        else kind_defaults.get("flash_front", "")
    )
    flash_back = (
        payload.flash_back
        if payload.flash_back is not None
        else kind_defaults.get("flash_back", "")
    )
    media_id = payload.media_id

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await assert_owned_record(conn, user_id=user_id, record_id=record_id)
            parent_id = await _validate_parent_id(
                conn,
                user_id=user_id,
                record_id=record_id,
                parent_id=payload.parent_id,
            )
            if media_id is not None:
                await media_service.get_media_metadata(user_id, media_id)
            sort_order = (
                payload.sort_order
                if payload.sort_order is not None
                else await items_repository.next_sort_order(
                    conn,
                    record_id=record_id,
                    parent_id=parent_id,
                )
            )
            try:
                row = await items_repository.insert_item(
                    conn,
                    user_id=user_id,
                    record_id=record_id,
                    parent_id=parent_id,
                    kind=kind,
                    name=name,
                    color_hex=color_hex,
                    sort_order=sort_order,
                    media_id=media_id,
                    note_body=note_body,
                    flash_front=flash_front,
                    flash_back=flash_back,
                )
            except UniqueViolationError as exc:
                raise AppError(
                    "An item with this name already exists in that folder.",
                    status_code=409,
                ) from exc

            tag_ids = await validate_coak_tag_ids(
                conn,
                user_id=user_id,
                record_id=record_id,
                tag_ids=payload.tag_ids,
            )
            if tag_ids:
                await tags_repository.replace_item_tags(
                    conn,
                    item_id=int(row["id"]),
                    record_id=record_id,
                    tag_ids=tag_ids,
                )

            tags_by_item = await tags_repository.fetch_tags_for_items(conn, [int(row["id"])])

    if row is None:
        raise AppError("Failed to create Coak item.", status_code=500)
    return item_to_public(
        row,
        tags=[
            tag_to_public(tag_row)
            for tag_row in tags_by_item.get(int(row["id"]), [])
        ],
    )


async def update_item(
    user_id: int,
    record_id: int,
    item_id: int,
    payload: CoakItemUpdate,
) -> CoakItemPublic:
    fields_set = payload.model_fields_set
    if not fields_set:
        raise AppError("No fields to update.", status_code=400)

    kind_provided = "kind" in fields_set
    kind = normalize_kind(payload.kind) if kind_provided and payload.kind is not None else None
    name = normalize_name(payload.name) if payload.name is not None else None
    color_hex = (
        normalize_color_hex(payload.color_hex) if payload.color_hex is not None else None
    )
    parent_id_provided = "parent_id" in fields_set
    media_id_provided = "media_id" in fields_set
    media_id = payload.media_id if media_id_provided else None

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await assert_owned_record(conn, user_id=user_id, record_id=record_id)
            existing = await items_repository.get_item(
                conn,
                user_id=user_id,
                record_id=record_id,
                item_id=item_id,
            )
            if existing is None:
                raise AppError("Coak item not found.", status_code=404)

            if kind_provided:
                if kind is None:
                    raise AppError("kind cannot be null.", status_code=400)
                if kind != existing["kind"]:
                    if existing["kind"] != "note" or kind != "folder":
                        raise AppError(
                            "Only note items can be promoted to folders.",
                            status_code=400,
                        )

            if media_id_provided and media_id is not None:
                await media_service.get_media_metadata(user_id, media_id)

            parent_id = existing["parent_id"]
            if parent_id_provided:
                if payload.parent_id == item_id:
                    raise AppError("An item cannot be moved into itself.", status_code=400)
                parent_id = await _validate_parent_id(
                    conn,
                    user_id=user_id,
                    record_id=record_id,
                    parent_id=payload.parent_id,
                    moving_item_id=item_id,
                )

            try:
                row = await items_repository.update_item(
                    conn,
                    user_id=user_id,
                    record_id=record_id,
                    item_id=item_id,
                    kind=kind,
                    kind_provided=kind_provided,
                    name=name,
                    parent_id=parent_id,
                    parent_id_provided=parent_id_provided,
                    color_hex=color_hex,
                    sort_order=payload.sort_order,
                    media_id=media_id,
                    media_id_provided=media_id_provided,
                    note_body=payload.note_body,
                    flash_front=payload.flash_front,
                    flash_back=payload.flash_back,
                )
            except UniqueViolationError as exc:
                raise AppError(
                    "An item with this name already exists in that folder.",
                    status_code=409,
                ) from exc

            if "tag_ids" in fields_set and payload.tag_ids is not None:
                tag_ids = await validate_coak_tag_ids(
                    conn,
                    user_id=user_id,
                    record_id=record_id,
                    tag_ids=payload.tag_ids,
                )
                await tags_repository.replace_item_tags(
                    conn,
                    item_id=item_id,
                    record_id=record_id,
                    tag_ids=tag_ids,
                )

            tags_by_item = await tags_repository.fetch_tags_for_items(conn, [item_id])

    if row is None:
        raise AppError("Coak item not found.", status_code=404)
    return item_to_public(
        row,
        tags=[
            tag_to_public(tag_row)
            for tag_row in tags_by_item.get(item_id, [])
        ],
    )


async def delete_item(user_id: int, record_id: int, item_id: int) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        await assert_owned_record(conn, user_id=user_id, record_id=record_id)
        target_ids = await items_repository.list_descendant_ids(
            conn,
            record_id=record_id,
            item_id=item_id,
        )
        if not target_ids:
            raise AppError("Coak item not found.", status_code=404)
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.COAK_ITEM,
        str(item_id),
    )



async def _validate_parent_id(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
    parent_id: int | None,
    moving_item_id: int | None = None,
) -> int | None:
    if parent_id is None:
        return None

    parent = await items_repository.get_item(
        conn,
        user_id=user_id,
        record_id=record_id,
        item_id=parent_id,
    )
    if parent is None:
        raise AppError("Parent folder not found.", status_code=404)
    if parent["kind"] != "folder":
        raise AppError("Parent must be a folder.", status_code=400)

    if moving_item_id is not None:
        descendants = await items_repository.list_descendant_ids(
            conn,
            record_id=record_id,
            item_id=moving_item_id,
        )
        if parent_id in descendants:
            raise AppError("Cannot move a folder into its own descendant.", status_code=400)

    return parent_id
