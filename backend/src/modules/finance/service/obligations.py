# keel_api/src/modules/finance/service/obligations.py

"""Obligation CRUD, obligation tags, and finance summary."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from asyncpg.exceptions import UniqueViolationError

from core.database import get_pool
from core.errors import AppError
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.finance import obligation_repository, obligation_tag_repository, payment_method_repository
from modules.finance.schemas import (
    FinanceObligationCreate,
    FinanceObligationPublic,
    FinanceObligationTagCreate,
    FinanceObligationTagPublic,
    FinanceObligationTagUpdate,
    FinanceObligationUpdate,
    FinanceSummaryPublic,
)
from modules.finance.service import _helpers


def _record_to_obligation(
    row,
    *,
    tags: list[FinanceObligationTagPublic] | None = None,
) -> FinanceObligationPublic:
    return FinanceObligationPublic(
        id=row["id"],
        user_id=row["user_id"],
        vendor_id=row["vendor_id"],
        vendor_name=row.get("vendor_name"),
        payment_method_id=row["payment_method_id"],
        payment_method_label=row.get("payment_method_label"),
        name=row["name"],
        kind=row["kind"],
        status=row["status"],
        amount=row["amount"],
        currency=row["currency"],
        billing_interval=row["billing_interval"],
        billing_day=row["billing_day"],
        started_at=row["started_at"],
        next_billing_at=row["next_billing_at"],
        cancelled_at=row["cancelled_at"],
        ends_at=row["ends_at"],
        account_url=row["account_url"],
        notes=row["notes"],
        sort_order=row["sort_order"],
        tags=tags or [],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


async def _validate_obligation_tag_ids(conn, *, user_id: int, tag_ids: list[int]) -> list[int]:
    deduped = _helpers.dedupe_tag_ids(tag_ids)
    if not deduped:
        return []

    owned_count = await obligation_tag_repository.count_owned_tags(
        conn,
        user_id=user_id,
        tag_ids=deduped,
    )
    if owned_count != len(deduped):
        raise AppError("One or more tags were not found.", status_code=400)
    return deduped


async def _get_owned_obligation_row(conn, user_id: int, obligation_id: int):
    row = await obligation_repository.get_obligation(conn, obligation_id)
    if row is None or row["user_id"] != user_id:
        raise AppError("Obligation not found.", status_code=404)
    return row


async def _obligation_public_from_row(conn, row) -> FinanceObligationPublic:
    tags_by_obligation = await obligation_tag_repository.fetch_tags_for_obligations(
        conn,
        [row["id"]],
    )
    tags = [
        _helpers.record_to_obligation_tag_assignment(tag_row)
        for tag_row in tags_by_obligation.get(row["id"], [])
    ]
    return _record_to_obligation(row, tags=tags)


async def _obligations_public_from_rows(conn, rows) -> list[FinanceObligationPublic]:
    if not rows:
        return []

    obligation_ids = [row["id"] for row in rows]
    tags_by_obligation = await obligation_tag_repository.fetch_tags_for_obligations(
        conn,
        obligation_ids,
    )
    return [
        _record_to_obligation(
            row,
            tags=[
                _helpers.record_to_obligation_tag_assignment(tag_row)
                for tag_row in tags_by_obligation.get(row["id"], [])
            ],
        )
        for row in rows
    ]


async def _resolve_payment_method_id(
    conn,
    *,
    user_id: int,
    payment_method_id: int | None,
) -> int | None:
    if payment_method_id is None:
        return None
    row = await payment_method_repository.get_payment_method(conn, payment_method_id)
    if row is None or row["user_id"] != user_id:
        raise AppError("Payment method not found.", status_code=404)
    return payment_method_id


async def list_obligations(
    user_id: int,
    *,
    status: str | None = None,
    kind: str | None = None,
    vendor_id: int | None = None,
    payment_method_id: int | None = None,
    tag_ids: list[int] | None = None,
    next_billing_before: datetime | None = None,
    query: str | None = None,
) -> list[FinanceObligationPublic]:
    normalized_status = _helpers.normalize_obligation_status(status) if status else None
    normalized_kind = _helpers.normalize_obligation_kind(kind) if kind else None

    if vendor_id is not None:
        pool = get_pool()
        async with pool.acquire() as conn:
            await _helpers.get_owned_vendor_row(conn, user_id, vendor_id)

    if payment_method_id is not None:
        pool = get_pool()
        async with pool.acquire() as conn:
            await _resolve_payment_method_id(
                conn,
                user_id=user_id,
                payment_method_id=payment_method_id,
            )

    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await obligation_repository.list_obligations(
            conn,
            user_id,
            status=normalized_status,
            kind=normalized_kind,
            vendor_id=vendor_id,
            payment_method_id=payment_method_id,
            tag_ids=_helpers.dedupe_tag_ids(tag_ids) if tag_ids else None,
            next_billing_before=next_billing_before,
            query=query,
        )
        return await _obligations_public_from_rows(conn, rows)


async def create_obligation(
    user_id: int,
    payload: FinanceObligationCreate,
) -> FinanceObligationPublic:
    name = payload.name.strip()
    if not name:
        raise AppError("Obligation name is required.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        vendor_id = await _helpers.resolve_vendor_id(
            conn,
            user_id=user_id,
            vendor_id=payload.vendor_id,
            vendor_name=payload.vendor_name,
        )
        payment_method_id = await _resolve_payment_method_id(
            conn,
            user_id=user_id,
            payment_method_id=payload.payment_method_id,
        )
        status = _helpers.normalize_obligation_status(payload.status)
        sort_order = await obligation_repository.next_obligation_sort_order(
            conn,
            user_id=user_id,
        )
        row = await obligation_repository.insert_obligation(
            conn,
            user_id=user_id,
            vendor_id=vendor_id,
            payment_method_id=payment_method_id,
            name=name,
            kind=_helpers.normalize_obligation_kind(payload.kind),
            status=status,
            amount=payload.amount,
            currency=_helpers.normalize_currency(payload.currency),
            billing_interval=_helpers.normalize_billing_interval(payload.billing_interval),
            billing_day=payload.billing_day,
            started_at=payload.started_at,
            next_billing_at=payload.next_billing_at,
            cancelled_at=None,
            ends_at=payload.ends_at,
            account_url=payload.account_url.strip() if payload.account_url else None,
            notes=payload.notes.strip(),
            sort_order=sort_order,
        )
        tag_ids = await _validate_obligation_tag_ids(
            conn,
            user_id=user_id,
            tag_ids=payload.tag_ids,
        )
        if tag_ids:
            await obligation_tag_repository.replace_obligation_tags(
                conn,
                obligation_id=row["id"],
                tag_ids=tag_ids,
            )
        return await _obligation_public_from_row(conn, row)


async def get_obligation(user_id: int, obligation_id: int) -> FinanceObligationPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await _get_owned_obligation_row(conn, user_id, obligation_id)
        return await _obligation_public_from_row(conn, row)


async def update_obligation(
    user_id: int,
    obligation_id: int,
    payload: FinanceObligationUpdate,
) -> FinanceObligationPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await _get_owned_obligation_row(conn, user_id, obligation_id)

        name = existing["name"]
        if payload.name is not None:
            name = payload.name.strip()
            if not name:
                raise AppError("Obligation name is required.", status_code=400)

        kind = existing["kind"]
        if payload.kind is not None:
            kind = _helpers.normalize_obligation_kind(payload.kind)

        status = existing["status"]
        if payload.status is not None:
            status = _helpers.normalize_obligation_status(payload.status)

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

        payment_method_id = existing["payment_method_id"]
        if "payment_method_id" in payload.model_fields_set:
            payment_method_id = await _resolve_payment_method_id(
                conn,
                user_id=user_id,
                payment_method_id=payload.payment_method_id,
            )

        amount = existing["amount"]
        if "amount" in payload.model_fields_set:
            amount = payload.amount

        currency = existing["currency"]
        if payload.currency is not None:
            currency = _helpers.normalize_currency(payload.currency)

        billing_interval = existing["billing_interval"]
        if payload.billing_interval is not None:
            billing_interval = _helpers.normalize_billing_interval(payload.billing_interval)

        billing_day = existing["billing_day"]
        if "billing_day" in payload.model_fields_set:
            billing_day = payload.billing_day

        started_at = existing["started_at"]
        if "started_at" in payload.model_fields_set:
            started_at = payload.started_at

        next_billing_at = existing["next_billing_at"]
        if "next_billing_at" in payload.model_fields_set:
            next_billing_at = payload.next_billing_at

        cancelled_at = existing["cancelled_at"]
        if "cancelled_at" in payload.model_fields_set:
            cancelled_at = payload.cancelled_at
        elif payload.status == "cancelled" and existing["status"] != "cancelled":
            cancelled_at = datetime.now(UTC)

        ends_at = existing["ends_at"]
        if "ends_at" in payload.model_fields_set:
            ends_at = payload.ends_at

        account_url = existing["account_url"]
        if payload.account_url is not None:
            account_url = payload.account_url.strip() or None

        notes = existing["notes"]
        if payload.notes is not None:
            notes = payload.notes.strip()

        sort_order = existing["sort_order"]
        if payload.sort_order is not None:
            sort_order = payload.sort_order

        row = await obligation_repository.update_obligation(
            conn,
            obligation_id=obligation_id,
            vendor_id=vendor_id,
            payment_method_id=payment_method_id,
            name=name,
            kind=kind,
            status=status,
            amount=amount,
            currency=currency,
            billing_interval=billing_interval,
            billing_day=billing_day,
            started_at=started_at,
            next_billing_at=next_billing_at,
            cancelled_at=cancelled_at,
            ends_at=ends_at,
            account_url=account_url,
            notes=notes,
            sort_order=sort_order,
        )
        if row is None:
            raise AppError("Obligation not found.", status_code=404)

        if payload.tag_ids is not None:
            tag_ids = await _validate_obligation_tag_ids(
                conn,
                user_id=user_id,
                tag_ids=payload.tag_ids,
            )
            await obligation_tag_repository.replace_obligation_tags(
                conn,
                obligation_id=obligation_id,
                tag_ids=tag_ids,
            )

        return await _obligation_public_from_row(conn, row)


async def delete_obligation(user_id: int, obligation_id: int) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_obligation_row(conn, user_id, obligation_id)
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.FINANCE_OBLIGATION,
        str(obligation_id),
    )


async def get_finance_summary(user_id: int) -> FinanceSummaryPublic:
    renewals_before = datetime.now(UTC) + timedelta(days=30)
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await obligation_repository.fetch_summary_metrics(
            conn,
            user_id,
            renewals_before=renewals_before,
        )
    if row is None:
        return FinanceSummaryPublic(
            active_obligation_count=0,
            monthly_burn=Decimal("0"),
            renewals_next_30_days=0,
        )
    return FinanceSummaryPublic(
        active_obligation_count=int(row["active_obligation_count"] or 0),
        monthly_burn=Decimal(str(row["monthly_burn"] or 0)),
        renewals_next_30_days=int(row["renewals_next_30_days"] or 0),
    )



# ----- Obligation tags
async def list_obligation_tags(user_id: int) -> list[FinanceObligationTagPublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await obligation_tag_repository.list_user_tags(conn, user_id)
    return [_helpers.record_to_obligation_tag(row) for row in rows]


async def create_obligation_tag(
    user_id: int,
    payload: FinanceObligationTagCreate,
) -> FinanceObligationTagPublic:
    name = _helpers.normalize_tag_name(payload.name)
    description = _helpers.normalize_tag_description(payload.description)
    color_hex = _helpers.normalize_tag_color(payload.color_hex)

    pool = get_pool()
    async with pool.acquire() as conn:
        try:
            row = await obligation_tag_repository.insert_user_tag(
                conn,
                user_id=user_id,
                name=name,
                description=description,
                color_hex=color_hex,
            )
        except UniqueViolationError as exc:
            raise AppError("Tag name already exists.", status_code=409) from exc

    return _helpers.record_to_obligation_tag(row)


async def update_obligation_tag(
    user_id: int,
    tag_id: int,
    payload: FinanceObligationTagUpdate,
) -> FinanceObligationTagPublic:
    color_hex = (
        _helpers.normalize_tag_color(payload.color_hex)
        if payload.color_hex is not None
        else None
    )

    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await obligation_tag_repository.get_user_tag(
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
            row = await obligation_tag_repository.update_user_tag(
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

    return _helpers.record_to_obligation_tag(row)


async def delete_obligation_tag(user_id: int, tag_id: int) -> None:
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.FINANCE_OBLIGATION_TAG,
        str(tag_id),
    )
