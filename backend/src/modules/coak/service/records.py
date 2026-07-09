# keel_api/src/modules/coak/service/records.py

"""Business logic for Coak records."""

from __future__ import annotations

import asyncpg

from core.database import get_pool
from core.errors import AppError
from modules.coak import config
from modules.coak.repository import records as records_repository
from modules.coak.schemas import CoakRecordCreate, CoakRecordPublic, CoakRecordUpdate
from modules.coak.service.helpers import (
    normalize_color_hex,
    normalize_name,
    record_to_public,
)
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service



async def list_records(user_id: int) -> list[CoakRecordPublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await records_repository.list_records(conn, user_id=user_id)
    return [record_to_public(row) for row in rows]


async def get_record(user_id: int, record_id: int) -> CoakRecordPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await records_repository.get_record(conn, user_id=user_id, record_id=record_id)
    if row is None:
        raise AppError("Coak record not found.", status_code=404)
    return record_to_public(row)


async def create_record(user_id: int, payload: CoakRecordCreate) -> CoakRecordPublic:
    name = normalize_name(payload.name)
    color_hex = normalize_color_hex(
        payload.color_hex,
        default=config.DEFAULT_RECORD_COLOR_HEX,
    )
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await records_repository.insert_record(
            conn,
            user_id=user_id,
            name=name,
            color_hex=color_hex,
        )
    if row is None:
        raise AppError("Failed to create Coak record.", status_code=500)
    return record_to_public(row)


async def update_record(
    user_id: int,
    record_id: int,
    payload: CoakRecordUpdate,
) -> CoakRecordPublic:
    name = normalize_name(payload.name, field_name="name") if payload.name is not None else None
    color_hex = (
        normalize_color_hex(payload.color_hex, default=config.DEFAULT_RECORD_COLOR_HEX)
        if payload.color_hex is not None
        else None
    )
    if name is None and color_hex is None:
        raise AppError("No fields to update.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        row = await records_repository.update_record(
            conn,
            user_id=user_id,
            record_id=record_id,
            name=name,
            color_hex=color_hex,
        )
    if row is None:
        raise AppError("Coak record not found.", status_code=404)
    return record_to_public(row)


async def delete_record(user_id: int, record_id: int) -> None:
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.COAK_RECORD,
        str(record_id),
    )
