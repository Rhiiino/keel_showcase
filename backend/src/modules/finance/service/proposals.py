# keel_api/src/modules/finance/service/proposals.py

"""Listing proposal confirm-before-create flow."""

from __future__ import annotations

import json
from decimal import Decimal
from typing import Any

import asyncpg

from core.database import get_pool
from core.errors import AppError
from modules.finance import proposal_repository, vendor_repository
from modules.finance.schemas import (
    FinanceListingProposalConfirmResult,
    FinanceListingProposalPublic,
    FinanceTransactionCreate,
    FinanceVendorPublic,
)
from modules.finance.service import _helpers, transactions, vendors


def parse_json_payload(raw: Any) -> dict[str, Any]:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        return json.loads(raw)
    raise AppError("Invalid proposal payload.", status_code=500)


def record_to_proposal(row: asyncpg.Record) -> FinanceListingProposalPublic:
    return FinanceListingProposalPublic(
        id=row["id"],
        status=row["status"],
        payload=parse_json_payload(row["payload"]),
        created_transaction_id=row["created_transaction_id"],
        created_vendor_id=row["created_vendor_id"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _format_price_field(purchase: dict[str, Any]) -> str | None:
    amount = purchase.get("price_amount")
    currency = purchase.get("currency")
    if amount is None:
        return None
    if currency:
        return f"{amount} {currency}"
    return str(amount)


def build_proposal_card(proposal_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    purchase = payload.get("purchase") or payload.get("item") or {}
    vendor = payload.get("vendor")
    fields: list[dict[str, str]] = []

    def add(label: str, value: object | None) -> None:
        if value is None or value == "":
            return
        fields.append({"label": label, "value": str(value)})

    add("Status", purchase.get("status"))
    add("Vendor", purchase.get("vendor_name") or (vendor or {}).get("name"))
    price = _format_price_field(purchase)
    if price:
        add("Price", price)
    add("Currency", purchase.get("currency"))
    add("Quantity", purchase.get("quantity"))
    add("Listing URL", purchase.get("listing_url"))
    add("Notes", purchase.get("notes"))

    card: dict[str, Any] = {
        "kind": "proposal",
        "proposal_id": proposal_id,
        "entity": "finance_transaction",
        "title": str(purchase.get("title") or "Transaction"),
        "image_url": payload.get("image_url"),
        "fields": fields,
    }
    if vendor and vendor.get("create_new"):
        card["vendor"] = vendor
    return card


async def _resolve_vendor_for_proposal_payload(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    payload: dict[str, Any],
) -> dict[str, Any]:
    from modules.finance.listing import service as listing_service

    purchase = dict(payload.get("purchase") or payload.get("item") or {})
    vendor_section: dict[str, Any] = dict(payload.get("vendor") or {})
    listing_url = purchase.get("listing_url")
    logo_candidates = listing_service.vendor_logo_url_candidates(
        str(listing_url) if listing_url else None,
    )
    logo_url = logo_candidates[0] if logo_candidates else None

    vendor_id = purchase.get("vendor_id")
    vendor_name = purchase.get("vendor_name")

    if vendor_id is not None:
        row = await _helpers.get_owned_vendor_row(conn, user_id, int(vendor_id))
        purchase["vendor_name"] = row["name"]
        logo = await _helpers.logo_for_vendor(conn, int(vendor_id))
        vendor_section = {
            "create_new": False,
            "name": row["name"],
            "website_url": row.get("website_url"),
            "logo_url": logo.url if logo else None,
        }
    elif vendor_name:
        name = _helpers.normalize_vendor_name(str(vendor_name))
        existing = await vendor_repository.find_by_name(conn, user_id=user_id, name=name)
        if existing is not None:
            purchase["vendor_id"] = existing["id"]
            purchase["vendor_name"] = existing["name"]
            logo = await _helpers.logo_for_vendor(conn, existing["id"])
            vendor_section = {
                "create_new": False,
                "name": existing["name"],
                "website_url": existing.get("website_url"),
                "logo_url": logo.url if logo else None,
            }
        else:
            purchase["vendor_name"] = name
            website_origin = listing_service.url_to_origin(
                str(listing_url) if listing_url else None,
            )
            vendor_section = {
                "create_new": True,
                "name": name,
                "website_url": website_origin,
                "logo_url": logo_url,
            }
    else:
        vendor_section = {}

    updated = dict(payload)
    updated["purchase"] = purchase
    if vendor_section:
        updated["vendor"] = vendor_section
    return updated


async def create_listing_proposal(
    user_id: int,
    *,
    conversation_id: int | None,
    payload: dict[str, Any],
) -> tuple[FinanceListingProposalPublic, dict[str, Any]]:
    pool = get_pool()
    async with pool.acquire() as conn:
        enriched = await _resolve_vendor_for_proposal_payload(
            conn,
            user_id=user_id,
            payload=payload,
        )
        row = await proposal_repository.insert_proposal(
            conn,
            user_id=user_id,
            conversation_id=conversation_id,
            payload=enriched,
        )
    proposal = record_to_proposal(row)
    card = build_proposal_card(proposal.id, enriched)
    return proposal, card


async def get_listing_proposal(
    user_id: int,
    proposal_id: int,
) -> FinanceListingProposalPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await proposal_repository.get_proposal(
            conn,
            proposal_id=proposal_id,
            user_id=user_id,
        )
    if row is None:
        raise AppError("Proposal not found.", status_code=404)
    return record_to_proposal(row)


async def decline_listing_proposal(
    user_id: int,
    proposal_id: int,
) -> FinanceListingProposalPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await proposal_repository.get_proposal(
            conn,
            proposal_id=proposal_id,
            user_id=user_id,
        )
        if existing is None:
            raise AppError("Proposal not found.", status_code=404)
        if existing["status"] != "pending":
            raise AppError(
                f"Proposal is already {existing['status']}.",
                status_code=409,
            )
        row = await proposal_repository.update_proposal_status(
            conn,
            proposal_id=proposal_id,
            user_id=user_id,
            status="declined",
        )
    if row is None:
        raise AppError("Proposal not found.", status_code=404)
    return record_to_proposal(row)


async def confirm_listing_proposal(
    user_id: int,
    proposal_id: int,
) -> FinanceListingProposalConfirmResult:
    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await proposal_repository.get_proposal(
            conn,
            proposal_id=proposal_id,
            user_id=user_id,
        )
        if existing is None:
            raise AppError("Proposal not found.", status_code=404)
        if existing["status"] != "pending":
            raise AppError(
                f"Proposal is already {existing['status']}.",
                status_code=409,
            )
        payload = parse_json_payload(existing["payload"])

    purchase_data = dict(payload.get("purchase") or payload.get("item") or {})
    vendor_data = payload.get("vendor") or {}
    image_url = payload.get("image_url")
    created_vendor: FinanceVendorPublic | None = None
    vendor_id = purchase_data.get("vendor_id")

    pool = get_pool()
    async with pool.acquire() as conn:
        if vendor_data.get("create_new"):
            name = _helpers.normalize_vendor_name(str(vendor_data.get("name") or ""))
            if not name:
                raise AppError("Proposal vendor name is missing.", status_code=400)
            from asyncpg.exceptions import UniqueViolationError

            try:
                row = await vendor_repository.insert_vendor(
                    conn,
                    user_id=user_id,
                    name=name,
                    website_url=vendor_data.get("website_url"),
                    billing_portal_url=None,
                    notes="",
                    default_currency=None,
                )
            except UniqueViolationError:
                row = await vendor_repository.find_or_create_by_name(
                    conn,
                    user_id=user_id,
                    name=name,
                )
            created_vendor = _helpers.record_to_vendor(row)
            vendor_id = created_vendor.id
            from modules.finance.listing import service as listing_service

            logo_page_url = vendor_data.get("website_url") or purchase_data.get("listing_url")
            candidates = listing_service.vendor_logo_url_candidates(
                str(logo_page_url) if logo_page_url else None,
            )
            logo_url = vendor_data.get("logo_url")
            if isinstance(logo_url, str) and logo_url.strip():
                primary = logo_url.strip()
                ordered = [primary] + [u for u in candidates if u != primary]
            else:
                ordered = candidates
            if ordered:
                await vendors.try_set_vendor_logo_from_candidates(
                    user_id,
                    vendor_id,
                    ordered,
                )
            async with pool.acquire() as conn:
                refreshed = await _helpers.get_owned_vendor_row(conn, user_id, vendor_id)
                created_vendor = await _helpers.vendor_public_from_row(conn, refreshed)

    title = str(purchase_data.get("title") or "").strip()
    if not title:
        raise AppError("Proposal purchase title is missing.", status_code=400)

    create_payload = FinanceTransactionCreate(
        title=title,
        kind="physical",
        status=str(purchase_data.get("status") or "considering"),
        vendor_id=int(vendor_id) if vendor_id is not None else None,
        vendor_name=None if vendor_id is not None else purchase_data.get("vendor_name"),
        listing_url=purchase_data.get("listing_url"),
        notes=str(purchase_data.get("notes") or ""),
        price_amount=(
            Decimal(str(purchase_data["price_amount"]))
            if purchase_data.get("price_amount") is not None
            else None
        ),
        currency=purchase_data.get("currency"),
        quantity=(
            int(purchase_data["quantity"])
            if purchase_data.get("quantity") is not None
            else None
        ),
    )
    transaction = await transactions.create_transaction(user_id, create_payload)

    if isinstance(image_url, str) and image_url.strip():
        transaction = await transactions.set_transaction_cover_from_url(
            user_id,
            transaction.id,
            image_url=image_url.strip(),
        )

    pool = get_pool()
    async with pool.acquire() as conn:
        row = await proposal_repository.update_proposal_status(
            conn,
            proposal_id=proposal_id,
            user_id=user_id,
            status="confirmed",
            created_transaction_id=transaction.id,
            created_vendor_id=created_vendor.id if created_vendor else vendor_id,
        )
    if row is None:
        raise AppError("Proposal not found.", status_code=404)

    proposal = record_to_proposal(row)
    return FinanceListingProposalConfirmResult(
        proposal=proposal,
        transaction=transaction,
        vendor=created_vendor,
    )
