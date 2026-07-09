# keel_api/src/modules/finance/service/transactions.py

"""Transaction CRUD, reorder, and cover media."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from core.database import get_pool
from core.errors import AppError
from core.tables import FINANCE_TRANSACTIONS
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.finance import transaction_repository, transaction_tag_repository
from modules.finance.schemas import (
    FinanceTransactionCreate,
    FinanceTransactionPublic,
    FinanceTransactionReorder,
    FinanceTransactionUpdate,
)
from modules.finance.service import _helpers
from modules.media import service as media_service


async def list_transactions(
    user_id: int,
    *,
    status: str | None = None,
    kind: str | None = None,
    vendor_id: int | None = None,
    query: str | None = None,
) -> list[FinanceTransactionPublic]:
    normalized_status = _helpers.normalize_transaction_status(status) if status else None
    normalized_kind = _helpers.normalize_transaction_kind(kind) if kind else None

    if vendor_id is not None:
        pool = get_pool()
        async with pool.acquire() as conn:
            await _helpers.get_owned_vendor_row(conn, user_id, vendor_id)

    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await transaction_repository.list_transactions(
            conn,
            user_id,
            status=normalized_status,
            kind=normalized_kind,
            vendor_id=vendor_id,
            query=query,
        )
        return await _helpers.transactions_public_from_rows(conn, rows)


async def create_transaction(
    user_id: int,
    payload: FinanceTransactionCreate,
) -> FinanceTransactionPublic:
    title = payload.title.strip()
    if not title:
        raise AppError("Transaction title is required.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        vendor_id = await _helpers.resolve_vendor_id(
            conn,
            user_id=user_id,
            vendor_id=payload.vendor_id,
            vendor_name=payload.vendor_name,
        )
        kind, obligation_id = await _helpers.resolve_transaction_kind_and_obligation(
            conn,
            user_id=user_id,
            kind=payload.kind,
            obligation_id=payload.obligation_id,
        )
        normalized_status = _helpers.normalize_transaction_status(payload.status)
        sort_order = await transaction_repository.next_transaction_sort_order(
            conn,
            user_id=user_id,
            status=normalized_status,
        )
        row = await transaction_repository.insert_transaction(
            conn,
            user_id=user_id,
            vendor_id=vendor_id,
            obligation_id=obligation_id,
            title=title,
            kind=kind,
            status=normalized_status,
            sort_order=sort_order,
            listing_url=payload.listing_url.strip() if payload.listing_url else None,
            notes=payload.notes.strip(),
            price_amount=payload.price_amount,
            currency=_helpers.normalize_currency(payload.currency),
            quantity=payload.quantity if payload.quantity is not None else 1,
            ordered_at=payload.ordered_at,
            received_at=payload.received_at,
        )
        tag_ids = await _helpers.validate_transaction_tag_ids(
            conn,
            user_id=user_id,
            tag_ids=payload.tag_ids,
        )
        if tag_ids:
            await transaction_tag_repository.replace_transaction_tags(
                conn,
                transaction_id=row["id"],
                tag_ids=tag_ids,
            )
        return await _helpers.transaction_public_from_row(conn, row)


async def get_transaction(user_id: int, transaction_id: int) -> FinanceTransactionPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await _helpers.get_owned_transaction_row(conn, user_id, transaction_id)
        return await _helpers.transaction_public_from_row(conn, row)


async def update_transaction(
    user_id: int,
    transaction_id: int,
    payload: FinanceTransactionUpdate,
) -> FinanceTransactionPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await _helpers.get_owned_transaction_row(conn, user_id, transaction_id)

        title = existing["title"]
        if payload.title is not None:
            title = payload.title.strip()
            if not title:
                raise AppError("Transaction title is required.", status_code=400)

        status = existing["status"]
        if payload.status is not None:
            status = _helpers.normalize_transaction_status(payload.status)

        kind = existing["kind"]
        obligation_id = existing["obligation_id"]
        if payload.kind is not None or "obligation_id" in payload.model_fields_set:
            next_kind = payload.kind if payload.kind is not None else kind
            next_obligation_id = (
                payload.obligation_id
                if "obligation_id" in payload.model_fields_set
                else obligation_id
            )
            kind, obligation_id = await _helpers.resolve_transaction_kind_and_obligation(
                conn,
                user_id=user_id,
                kind=next_kind,
                obligation_id=next_obligation_id,
            )

        vendor_id = existing["vendor_id"]
        if "vendor_id" in payload.model_fields_set or payload.vendor_name is not None:
            if "vendor_id" in payload.model_fields_set and payload.vendor_id is None:
                vendor_id = None
            else:
                vendor_id = await _helpers.resolve_vendor_id(
                    conn,
                    user_id=user_id,
                    vendor_id=payload.vendor_id,
                    vendor_name=payload.vendor_name,
                    existing_vendor_id=existing["vendor_id"],
                )

        listing_url = existing["listing_url"]
        if payload.listing_url is not None:
            listing_url = payload.listing_url.strip() or None

        notes = existing["notes"]
        if payload.notes is not None:
            notes = payload.notes.strip()

        price_amount = existing["price_amount"]
        if "price_amount" in payload.model_fields_set:
            price_amount = payload.price_amount

        currency = existing["currency"]
        if payload.currency is not None:
            currency = _helpers.normalize_currency(payload.currency)

        quantity = existing["quantity"]
        if payload.quantity is not None:
            quantity = payload.quantity

        ordered_at = existing["ordered_at"]
        if "ordered_at" in payload.model_fields_set:
            ordered_at = payload.ordered_at

        received_at = existing["received_at"]
        if "received_at" in payload.model_fields_set:
            received_at = payload.received_at

        sort_order = existing["sort_order"]
        if payload.sort_order is not None:
            sort_order = payload.sort_order

        row = await transaction_repository.update_transaction(
            conn,
            transaction_id=transaction_id,
            vendor_id=vendor_id,
            obligation_id=obligation_id,
            title=title,
            kind=kind,
            status=status,
            sort_order=sort_order,
            listing_url=listing_url,
            notes=notes,
            price_amount=price_amount,
            currency=currency,
            quantity=quantity,
            ordered_at=ordered_at,
            received_at=received_at,
        )
        if row is None:
            raise AppError("Transaction not found.", status_code=404)

        if payload.tag_ids is not None:
            tag_ids = await _helpers.validate_transaction_tag_ids(
                conn,
                user_id=user_id,
                tag_ids=payload.tag_ids,
            )
            await transaction_tag_repository.replace_transaction_tags(
                conn,
                transaction_id=transaction_id,
                tag_ids=tag_ids,
            )

        return await _helpers.transaction_public_from_row(conn, row)


async def reorder_transactions(
    user_id: int,
    payload: FinanceTransactionReorder,
) -> list[FinanceTransactionPublic]:
    entries: list[tuple[int, str, int]] = []
    transaction_ids: list[int] = []
    for entry in payload.items:
        normalized_status = _helpers.normalize_transaction_status(entry.status)
        entries.append((entry.id, normalized_status, entry.sort_order))
        transaction_ids.append(entry.id)

    pool = get_pool()
    async with pool.acquire() as conn:
        owned_count = await conn.fetchval(
            f"""
            SELECT COUNT(*)
            FROM {FINANCE_TRANSACTIONS}
            WHERE user_id = $1 AND id = ANY($2::int[])
            """,
            user_id,
            transaction_ids,
        )
        if owned_count != len(set(transaction_ids)):
            raise AppError("One or more transactions were not found.", status_code=400)
        await transaction_repository.reorder_transactions(
            conn,
            user_id=user_id,
            entries=entries,
        )
        rows = await transaction_repository.list_transactions(conn, user_id)
        id_set = set(transaction_ids)
        filtered = [row for row in rows if row["id"] in id_set]
        return await _helpers.transactions_public_from_rows(conn, filtered)


async def delete_transaction(user_id: int, transaction_id: int) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        await _helpers.get_owned_transaction_row(conn, user_id, transaction_id)
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.FINANCE_TRANSACTION,
        str(transaction_id),
    )


async def mark_transaction_ordered(
    user_id: int,
    transaction_id: int,
    *,
    ordered_at: datetime | None = None,
) -> FinanceTransactionPublic:
    payload = FinanceTransactionUpdate(
        status="ordered",
        ordered_at=ordered_at or datetime.now(UTC),
    )
    return await update_transaction(user_id, transaction_id, payload)


async def mark_transaction_received(
    user_id: int,
    transaction_id: int,
    *,
    received_at: datetime | None = None,
) -> FinanceTransactionPublic:
    payload = FinanceTransactionUpdate(
        status="received",
        received_at=received_at or datetime.now(UTC),
    )
    return await update_transaction(user_id, transaction_id, payload)


async def set_transaction_cover_from_media(
    user_id: int,
    transaction_id: int,
    media_id: UUID,
) -> FinanceTransactionPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        await _helpers.get_owned_transaction_row(conn, user_id, transaction_id)
    await _helpers.attach_transaction_cover(user_id, transaction_id, media_id)
    return await get_transaction(user_id, transaction_id)


async def clear_transaction_cover(user_id: int, transaction_id: int) -> FinanceTransactionPublic:
    await media_service.detach_cover(
        user_id,
        entity_type="finance_transaction",
        entity_id=transaction_id,
    )
    return await get_transaction(user_id, transaction_id)


async def set_transaction_cover_from_url(
    user_id: int,
    transaction_id: int,
    *,
    image_url: str,
) -> FinanceTransactionPublic:
    from modules.finance.listing import service as listing_service

    pool = get_pool()
    async with pool.acquire() as conn:
        await _helpers.get_owned_transaction_row(conn, user_id, transaction_id)

    data, mime = await listing_service.download_image(image_url)
    await _helpers.upload_and_attach_transaction_cover_from_bytes(
        user_id,
        transaction_id,
        filename=_helpers.filename_from_image_url(image_url, mime),
        content_type=mime,
        data=data,
    )
    return await get_transaction(user_id, transaction_id)
