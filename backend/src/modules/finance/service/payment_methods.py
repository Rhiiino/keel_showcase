# keel_api/src/modules/finance/service/payment_methods.py

"""Payment method CRUD and reorder."""

from __future__ import annotations

from asyncpg.exceptions import UniqueViolationError

from core.database import get_pool
from core.errors import AppError
from core.tables import FINANCE_PAYMENT_METHODS
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.finance import payment_method_repository
from modules.finance.schemas import (
    FinancePaymentMethodCreate,
    FinancePaymentMethodPublic,
    FinancePaymentMethodReorder,
    FinancePaymentMethodUpdate,
)
from modules.finance.service import _helpers


def _record_to_payment_method(row) -> FinancePaymentMethodPublic:
    return FinancePaymentMethodPublic(
        id=row["id"],
        kind=row["kind"],
        label=row["label"],
        institution_name=row["institution_name"],
        last_four=row["last_four"],
        notes=row["notes"],
        is_active=bool(row["is_active"]),
        sort_order=row["sort_order"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


async def _get_owned_payment_method_row(conn, user_id: int, payment_method_id: int):
    row = await payment_method_repository.get_payment_method(conn, payment_method_id)
    if row is None or row["user_id"] != user_id:
        raise AppError("Payment method not found.", status_code=404)
    return row


async def list_payment_methods(user_id: int) -> list[FinancePaymentMethodPublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await payment_method_repository.list_payment_methods(conn, user_id)
    return [_record_to_payment_method(row) for row in rows]


async def create_payment_method(
    user_id: int,
    payload: FinancePaymentMethodCreate,
) -> FinancePaymentMethodPublic:
    label = payload.label.strip()
    if not label:
        raise AppError("Payment method label is required.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        sort_order = await payment_method_repository.next_payment_method_sort_order(
            conn,
            user_id=user_id,
        )
        try:
            row = await payment_method_repository.insert_payment_method(
                conn,
                user_id=user_id,
                kind=_helpers.normalize_payment_method_kind(payload.kind),
                label=label,
                institution_name=(
                    payload.institution_name.strip() if payload.institution_name else None
                ),
                last_four=_helpers.normalize_last_four(payload.last_four),
                notes=payload.notes.strip(),
                is_active=payload.is_active,
                sort_order=sort_order,
            )
        except UniqueViolationError as exc:
            raise AppError("Payment method label already exists.", status_code=409) from exc

    return _record_to_payment_method(row)


async def get_payment_method(
    user_id: int,
    payment_method_id: int,
) -> FinancePaymentMethodPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await _get_owned_payment_method_row(conn, user_id, payment_method_id)
    return _record_to_payment_method(row)


async def update_payment_method(
    user_id: int,
    payment_method_id: int,
    payload: FinancePaymentMethodUpdate,
) -> FinancePaymentMethodPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await _get_owned_payment_method_row(conn, user_id, payment_method_id)

        kind = existing["kind"]
        if payload.kind is not None:
            kind = _helpers.normalize_payment_method_kind(payload.kind)

        label = existing["label"]
        if payload.label is not None:
            label = payload.label.strip()
            if not label:
                raise AppError("Payment method label is required.", status_code=400)

        institution_name = existing["institution_name"]
        if payload.institution_name is not None:
            institution_name = payload.institution_name.strip() or None

        last_four = existing["last_four"]
        if "last_four" in payload.model_fields_set:
            last_four = _helpers.normalize_last_four(payload.last_four)

        notes = existing["notes"]
        if payload.notes is not None:
            notes = payload.notes.strip()

        is_active = bool(existing["is_active"])
        if payload.is_active is not None:
            is_active = payload.is_active

        sort_order = existing["sort_order"]
        if payload.sort_order is not None:
            sort_order = payload.sort_order

        try:
            row = await payment_method_repository.update_payment_method(
                conn,
                payment_method_id=payment_method_id,
                kind=kind,
                label=label,
                institution_name=institution_name,
                last_four=last_four,
                notes=notes,
                is_active=is_active,
                sort_order=sort_order,
            )
        except UniqueViolationError as exc:
            raise AppError("Payment method label already exists.", status_code=409) from exc

        if row is None:
            raise AppError("Payment method not found.", status_code=404)

    return _record_to_payment_method(row)


async def reorder_payment_methods(
    user_id: int,
    payload: FinancePaymentMethodReorder,
) -> list[FinancePaymentMethodPublic]:
    entries: list[tuple[int, int]] = []
    payment_method_ids: list[int] = []
    for entry in payload.items:
        entries.append((entry.id, entry.sort_order))
        payment_method_ids.append(entry.id)

    pool = get_pool()
    async with pool.acquire() as conn:
        owned_count = await conn.fetchval(
            f"""
            SELECT COUNT(*)
            FROM {FINANCE_PAYMENT_METHODS}
            WHERE user_id = $1 AND id = ANY($2::int[])
            """,
            user_id,
            payment_method_ids,
        )
        if owned_count != len(set(payment_method_ids)):
            raise AppError("One or more payment methods were not found.", status_code=400)
        await payment_method_repository.reorder_payment_methods(
            conn,
            user_id=user_id,
            entries=entries,
        )
        rows = await payment_method_repository.list_payment_methods(conn, user_id)
        id_set = set(payment_method_ids)
        filtered = [row for row in rows if row["id"] in id_set]
    return [_record_to_payment_method(row) for row in filtered]


async def delete_payment_method(user_id: int, payment_method_id: int) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_payment_method_row(conn, user_id, payment_method_id)
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.FINANCE_PAYMENT_METHOD,
        str(payment_method_id),
    )
