# keel_api/src/modules/finance/service/vendors.py

"""Vendor CRUD and maintenance."""

from __future__ import annotations

from asyncpg.exceptions import UniqueViolationError

from core.database import get_pool
from core.errors import AppError
from core.tables import FINANCE_VENDORS
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.finance import vendor_repository
from modules.finance.schemas import FinanceVendorCreate, FinanceVendorPublic, FinanceVendorUpdate
from modules.finance.service import _helpers


async def list_vendors(
    user_id: int,
    *,
    query: str | None = None,
) -> list[FinanceVendorPublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await vendor_repository.list_vendors(conn, user_id, query=query)
        return [await _helpers.vendor_public_from_row(conn, row) for row in rows]


async def create_vendor(
    user_id: int,
    payload: FinanceVendorCreate,
) -> FinanceVendorPublic:
    name = _helpers.normalize_vendor_name(payload.name)
    pool = get_pool()
    async with pool.acquire() as conn:
        try:
            row = await vendor_repository.insert_vendor(
                conn,
                user_id=user_id,
                name=name,
                website_url=payload.website_url.strip() if payload.website_url else None,
                billing_portal_url=(
                    payload.billing_portal_url.strip() if payload.billing_portal_url else None
                ),
                notes=payload.notes.strip(),
                default_currency=(
                    _helpers.normalize_currency(payload.default_currency)
                    if payload.default_currency
                    else None
                ),
            )
        except UniqueViolationError as exc:
            raise AppError("Vendor name already exists.", status_code=409) from exc
    return _helpers.record_to_vendor(row)


async def update_vendor(
    user_id: int,
    vendor_id: int,
    payload: FinanceVendorUpdate,
) -> FinanceVendorPublic:
    if (
        payload.name is None
        and payload.website_url is None
        and payload.billing_portal_url is None
        and payload.notes is None
        and payload.default_currency is None
    ):
        raise AppError("No vendor fields to update.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await _helpers.get_owned_vendor_row(conn, user_id, vendor_id)

        name = existing["name"]
        if payload.name is not None:
            name = _helpers.normalize_vendor_name(payload.name)

        website_url = existing["website_url"]
        if payload.website_url is not None:
            website_url = payload.website_url.strip() or None

        billing_portal_url = existing.get("billing_portal_url")
        if payload.billing_portal_url is not None:
            billing_portal_url = payload.billing_portal_url.strip() or None

        notes = existing["notes"]
        if payload.notes is not None:
            notes = payload.notes.strip()

        default_currency = existing["default_currency"]
        if payload.default_currency is not None:
            default_currency = (
                _helpers.normalize_currency(payload.default_currency)
                if payload.default_currency.strip()
                else None
            )

        try:
            row = await vendor_repository.update_vendor(
                conn,
                vendor_id=vendor_id,
                name=name,
                website_url=website_url,
                billing_portal_url=billing_portal_url,
                notes=notes,
                default_currency=default_currency,
            )
        except UniqueViolationError as exc:
            raise AppError("Vendor name already exists.", status_code=409) from exc

        if row is None:
            raise AppError("Vendor not found.", status_code=404)

        return await _helpers.vendor_public_from_row(conn, row)


async def delete_vendor(user_id: int, vendor_id: int) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        await _helpers.get_owned_vendor_row(conn, user_id, vendor_id)
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.FINANCE_VENDOR,
        str(vendor_id),
    )


async def set_vendor_logo_from_url(
    user_id: int,
    vendor_id: int,
    *,
    image_url: str,
) -> None:
    from modules.finance.listing import service as listing_service

    data, mime = await listing_service.download_image(image_url)
    await _helpers.upload_and_attach_vendor_logo_from_bytes(
        user_id,
        vendor_id,
        content_type=mime,
        data=data,
        filename=_helpers.filename_from_image_url(image_url, mime),
    )


async def try_set_vendor_logo_from_candidates(
    user_id: int,
    vendor_id: int,
    candidates: list[str],
) -> None:
    for url in candidates:
        try:
            await set_vendor_logo_from_url(user_id, vendor_id, image_url=url)
            return
        except AppError:
            continue


async def backfill_vendors_websites_and_logos() -> dict[str, int]:
    """Normalize vendor website_url to origin and fetch logos where missing."""
    from modules.finance.listing import service as listing_service

    pool = get_pool()
    websites_fixed = 0
    logos_set = 0
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT id, user_id, name, website_url
            FROM {FINANCE_VENDORS}
            ORDER BY id ASC
            """
        )
    for row in rows:
        vendor_id = int(row["id"])
        user_id = int(row["user_id"])
        origin = listing_service.url_to_origin(row["website_url"])
        if origin and origin != row["website_url"]:
            async with pool.acquire() as conn:
                owned = await _helpers.get_owned_vendor_row(conn, user_id, vendor_id)
            await update_vendor(
                user_id,
                vendor_id,
                FinanceVendorUpdate(
                    name=owned["name"],
                    website_url=origin,
                    notes=owned["notes"],
                    default_currency=owned["default_currency"],
                ),
            )
            websites_fixed += 1
        page_url = origin or row["website_url"]
        async with pool.acquire() as conn:
            existing_logo = await _helpers.logo_for_vendor(conn, vendor_id)
        if existing_logo is not None:
            continue
        candidates = listing_service.vendor_logo_url_candidates(
            str(page_url) if page_url else None,
        )
        if not candidates:
            continue
        await try_set_vendor_logo_from_candidates(user_id, vendor_id, candidates)
        async with pool.acquire() as conn:
            refreshed_logo = await _helpers.logo_for_vendor(conn, vendor_id)
        if refreshed_logo is not None:
            logos_set += 1
    return {"websites_fixed": websites_fixed, "logos_set": logos_set}
