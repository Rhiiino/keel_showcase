# keel_api/src/modules/finance/service/transaction_tags.py

"""Transaction tag catalog CRUD."""

from __future__ import annotations

from asyncpg.exceptions import UniqueViolationError

from core.database import get_pool
from core.errors import AppError
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.finance import transaction_tag_repository
from modules.finance.schemas import (
    FinanceTransactionTagCreate,
    FinanceTransactionTagPublic,
    FinanceTransactionTagUpdate,
)
from modules.finance.service import _helpers


async def list_transaction_tags(user_id: int) -> list[FinanceTransactionTagPublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await transaction_tag_repository.list_user_tags(conn, user_id)
    return [_helpers.record_to_transaction_tag(row) for row in rows]


async def create_transaction_tag(
    user_id: int,
    payload: FinanceTransactionTagCreate,
) -> FinanceTransactionTagPublic:
    name = _helpers.normalize_tag_name(payload.name)
    description = _helpers.normalize_tag_description(payload.description)
    color_hex = _helpers.normalize_tag_color(payload.color_hex)

    pool = get_pool()
    async with pool.acquire() as conn:
        try:
            row = await transaction_tag_repository.insert_user_tag(
                conn,
                user_id=user_id,
                name=name,
                description=description,
                color_hex=color_hex,
            )
        except UniqueViolationError as exc:
            raise AppError("Tag name already exists.", status_code=409) from exc

    return _helpers.record_to_transaction_tag(row)


async def update_transaction_tag(
    user_id: int,
    tag_id: int,
    payload: FinanceTransactionTagUpdate,
) -> FinanceTransactionTagPublic:
    color_hex = (
        _helpers.normalize_tag_color(payload.color_hex)
        if payload.color_hex is not None
        else None
    )

    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await transaction_tag_repository.get_user_tag(
            conn,
            user_id=user_id,
            tag_id=tag_id,
        )
        if existing is None:
            raise AppError("Tag not found.", status_code=404)

        resolved_name = (
            _helpers.normalize_tag_name(payload.name)
            if payload.name is not None
            else existing["name"]
        )
        resolved_description = (
            _helpers.normalize_tag_description(payload.description)
            if "description" in payload.model_fields_set
            else existing.get("description")
        )
        resolved_color = (
            color_hex if payload.color_hex is not None else existing["color_hex"]
        )

        try:
            row = await transaction_tag_repository.update_user_tag(
                conn,
                user_id=user_id,
                tag_id=tag_id,
                name=resolved_name,
                description=resolved_description,
                color_hex=resolved_color,
            )
        except UniqueViolationError as exc:
            raise AppError("Tag name already exists.", status_code=409) from exc

        if row is None:
            raise AppError("Tag not found.", status_code=404)

    return _helpers.record_to_transaction_tag(row)


async def delete_transaction_tag(user_id: int, tag_id: int) -> None:
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.FINANCE_TRANSACTION_TAG,
        str(tag_id),
    )
