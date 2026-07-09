# keel_api/src/modules/finance/service/_helpers.py

"""Shared helpers for finance service modules."""

from __future__ import annotations

import re
from pathlib import Path
from uuid import UUID

import asyncpg

from core.errors import AppError
from modules.finance import config
from modules.finance import obligation_repository, transaction_tag_repository, vendor_repository
from modules.finance.schemas import (
    FinanceObligationTagPublic,
    FinanceTransactionPublic,
    FinanceTransactionTagPublic,
    FinanceVendorPublic,
)
from modules.media import service as media_service
from modules.media.schemas import MediaAttachmentCreate, MediaAttachmentPublic, MediaPublic


def record_to_vendor(
    row: asyncpg.Record,
    *,
    logo: MediaPublic | None = None,
) -> FinanceVendorPublic:
    return FinanceVendorPublic(
        id=row["id"],
        name=row["name"],
        website_url=row["website_url"],
        billing_portal_url=row.get("billing_portal_url"),
        notes=row["notes"],
        default_currency=row["default_currency"],
        logo=logo,
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def record_to_transaction(
    row: asyncpg.Record,
    *,
    cover: MediaPublic | None = None,
    gallery: list[MediaAttachmentPublic] | None = None,
    tags: list[FinanceTransactionTagPublic] | None = None,
) -> FinanceTransactionPublic:
    return FinanceTransactionPublic(
        id=row["id"],
        user_id=row["user_id"],
        title=row["title"],
        kind=row["kind"],
        status=row["status"],
        sort_order=row["sort_order"],
        vendor_id=row["vendor_id"],
        vendor_name=row.get("vendor_name"),
        obligation_id=row.get("obligation_id"),
        obligation_name=row.get("obligation_name"),
        listing_url=row["listing_url"],
        notes=row["notes"],
        price_amount=row["price_amount"],
        currency=row["currency"],
        quantity=row["quantity"],
        ordered_at=row["ordered_at"],
        received_at=row["received_at"],
        cover=cover,
        gallery=gallery or [],
        tags=tags or [],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def record_to_transaction_tag(row: asyncpg.Record) -> FinanceTransactionTagPublic:
    return FinanceTransactionTagPublic(
        id=row["id"],
        name=row["name"],
        description=row.get("description"),
        color_hex=row["color_hex"],
        transaction_count=int(row.get("transaction_count") or 0),
    )


def record_to_transaction_tag_assignment(row: asyncpg.Record) -> FinanceTransactionTagPublic:
    return FinanceTransactionTagPublic(
        id=row["id"],
        name=row["name"],
        description=row.get("description"),
        color_hex=row["color_hex"],
        transaction_count=0,
    )


def record_to_obligation_tag(row: asyncpg.Record) -> FinanceObligationTagPublic:
    return FinanceObligationTagPublic(
        id=row["id"],
        name=row["name"],
        description=row.get("description"),
        color_hex=row["color_hex"],
        obligation_count=int(row.get("obligation_count") or 0),
    )


def record_to_obligation_tag_assignment(row: asyncpg.Record) -> FinanceObligationTagPublic:
    return FinanceObligationTagPublic(
        id=row["id"],
        name=row["name"],
        description=row.get("description"),
        color_hex=row["color_hex"],
        obligation_count=0,
    )


def normalize_transaction_kind(kind: str) -> str:
    normalized = kind.strip().lower()
    if normalized not in config.VALID_TRANSACTION_KINDS:
        allowed = ", ".join(sorted(config.VALID_TRANSACTION_KINDS))
        raise AppError(
            f"Invalid kind {kind!r}; expected one of: {allowed}.",
            status_code=400,
        )
    return normalized


def normalize_transaction_status(status: str) -> str:
    normalized = status.strip().lower()
    if normalized not in config.VALID_TRANSACTION_STATUSES:
        allowed = ", ".join(sorted(config.VALID_TRANSACTION_STATUSES))
        raise AppError(
            f"Invalid status {status!r}; expected one of: {allowed}.",
            status_code=400,
        )
    return normalized


def normalize_obligation_status(status: str) -> str:
    normalized = status.strip().lower()
    if normalized not in config.VALID_OBLIGATION_STATUSES:
        allowed = ", ".join(sorted(config.VALID_OBLIGATION_STATUSES))
        raise AppError(
            f"Invalid status {status!r}; expected one of: {allowed}.",
            status_code=400,
        )
    return normalized


def normalize_obligation_kind(kind: str) -> str:
    normalized = kind.strip().lower()
    if normalized not in config.VALID_OBLIGATION_KINDS:
        allowed = ", ".join(sorted(config.VALID_OBLIGATION_KINDS))
        raise AppError(
            f"Invalid kind {kind!r}; expected one of: {allowed}.",
            status_code=400,
        )
    return normalized


def normalize_billing_interval(interval: str) -> str:
    normalized = interval.strip().lower()
    if normalized not in config.VALID_BILLING_INTERVALS:
        allowed = ", ".join(sorted(config.VALID_BILLING_INTERVALS))
        raise AppError(
            f"Invalid billing_interval {interval!r}; expected one of: {allowed}.",
            status_code=400,
        )
    return normalized


def normalize_payment_method_kind(kind: str) -> str:
    normalized = kind.strip().lower()
    if normalized not in config.VALID_PAYMENT_METHOD_KINDS:
        allowed = ", ".join(sorted(config.VALID_PAYMENT_METHOD_KINDS))
        raise AppError(
            f"Invalid kind {kind!r}; expected one of: {allowed}.",
            status_code=400,
        )
    return normalized


def normalize_vendor_name(name: str) -> str:
    normalized = name.strip()
    if not normalized:
        raise AppError("Vendor name is required.", status_code=400)
    if len(normalized) > 120:
        raise AppError("Vendor name must be at most 120 characters.", status_code=400)
    return normalized


def normalize_currency(currency: str | None) -> str:
    if currency is None or not currency.strip():
        return "USD"
    normalized = currency.strip().upper()
    if len(normalized) > 8:
        raise AppError("Currency must be at most 8 characters.", status_code=400)
    return normalized


def dedupe_tag_ids(tag_ids: list[int]) -> list[int]:
    seen: set[int] = set()
    deduped: list[int] = []
    for tag_id in tag_ids:
        if tag_id in seen:
            continue
        seen.add(tag_id)
        deduped.append(tag_id)
    return deduped


def normalize_tag_name(name: str) -> str:
    normalized = name.strip()
    if not normalized:
        raise AppError("Tag name is required.", status_code=400)
    if len(normalized) > 80:
        raise AppError("Tag name must be at most 80 characters.", status_code=400)
    return normalized


def normalize_tag_color(color_hex: str | None) -> str:
    if color_hex is None:
        return config.DEFAULT_TAG_COLOR_HEX
    normalized = color_hex.strip()
    if not normalized:
        return config.DEFAULT_TAG_COLOR_HEX
    if re.fullmatch(r"#[0-9A-Fa-f]{6}", normalized) is None:
        raise AppError(
            "color_hex must be a valid 6-digit hex color like #06B6D4.",
            status_code=400,
        )
    return normalized.upper()


def normalize_tag_description(description: str | None) -> str | None:
    if description is None:
        return None
    normalized = description.strip()
    if not normalized:
        return None
    if len(normalized) > 512:
        raise AppError("Tag description must be at most 512 characters.", status_code=400)
    return normalized


def normalize_last_four(last_four: str | None) -> str | None:
    if last_four is None:
        return None
    normalized = last_four.strip()
    if not normalized:
        return None
    if re.fullmatch(r"\d{4}", normalized) is None:
        raise AppError("last_four must be exactly 4 digits.", status_code=400)
    return normalized


def filename_from_image_url(image_url: str, mime: str) -> str:
    path = Path(image_url.split("?", maxsplit=1)[0])
    name = path.name.strip()
    if name and "." in name:
        return name[:512]
    ext_map = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }
    return f"cover-import{ext_map.get(mime, '.jpg')}"


async def validate_transaction_tag_ids(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_ids: list[int],
) -> list[int]:
    deduped = dedupe_tag_ids(tag_ids)
    if not deduped:
        return []

    owned_count = await transaction_tag_repository.count_owned_tags(
        conn,
        user_id=user_id,
        tag_ids=deduped,
    )
    if owned_count != len(deduped):
        raise AppError("One or more tags were not found.", status_code=400)
    return deduped


async def logo_for_vendor(
    conn: asyncpg.Connection,
    vendor_id: int,
) -> MediaPublic | None:
    attachment = await media_service.get_attachment_for_entity_role(
        conn,
        entity_type="finance_vendor",
        entity_id=vendor_id,
        role="logo",
    )
    return attachment.media if attachment else None


async def media_for_transaction(
    conn: asyncpg.Connection,
    transaction_id: int,
) -> tuple[MediaPublic | None, list[MediaAttachmentPublic]]:
    cover_attachment = await media_service.get_attachment_for_entity_role(
        conn,
        entity_type="finance_transaction",
        entity_id=transaction_id,
        role="cover",
    )
    gallery = await media_service.list_gallery_for_entity(
        conn,
        entity_type="finance_transaction",
        entity_id=transaction_id,
    )
    cover = cover_attachment.media if cover_attachment else None
    return cover, gallery


async def vendor_public_from_row(
    conn: asyncpg.Connection,
    row: asyncpg.Record,
) -> FinanceVendorPublic:
    logo = await logo_for_vendor(conn, row["id"])
    return record_to_vendor(row, logo=logo)


async def transaction_public_from_row(
    conn: asyncpg.Connection,
    row: asyncpg.Record,
) -> FinanceTransactionPublic:
    cover, gallery = await media_for_transaction(conn, row["id"])
    tags_by_transaction = await transaction_tag_repository.fetch_tags_for_transactions(
        conn,
        [row["id"]],
    )
    tags = [
        record_to_transaction_tag_assignment(tag_row)
        for tag_row in tags_by_transaction.get(row["id"], [])
    ]
    refreshed = await _refresh_transaction_joined_row(conn, row["id"])
    return record_to_transaction(refreshed or row, cover=cover, gallery=gallery, tags=tags)


async def transactions_public_from_rows(
    conn: asyncpg.Connection,
    rows: list[asyncpg.Record],
) -> list[FinanceTransactionPublic]:
    if not rows:
        return []

    transaction_ids = [row["id"] for row in rows]
    tags_by_transaction = await transaction_tag_repository.fetch_tags_for_transactions(
        conn,
        transaction_ids,
    )
    transactions: list[FinanceTransactionPublic] = []
    for row in rows:
        cover, gallery = await media_for_transaction(conn, row["id"])
        tags = [
            record_to_transaction_tag_assignment(tag_row)
            for tag_row in tags_by_transaction.get(row["id"], [])
        ]
        transactions.append(record_to_transaction(row, cover=cover, gallery=gallery, tags=tags))
    return transactions


async def _refresh_transaction_joined_row(
    conn: asyncpg.Connection,
    transaction_id: int,
) -> asyncpg.Record | None:
    from modules.finance import transaction_repository

    return await transaction_repository.get_transaction(conn, transaction_id)


async def get_owned_transaction_row(
    conn: asyncpg.Connection,
    user_id: int,
    transaction_id: int,
) -> asyncpg.Record:
    from modules.finance import transaction_repository

    row = await transaction_repository.get_transaction(conn, transaction_id)
    if row is None or row["user_id"] != user_id:
        raise AppError("Transaction not found.", status_code=404)
    return row


async def get_owned_obligation_row(
    conn: asyncpg.Connection,
    user_id: int,
    obligation_id: int,
) -> asyncpg.Record:
    row = await obligation_repository.get_obligation(conn, obligation_id)
    if row is None or row["user_id"] != user_id:
        raise AppError("Subscription not found.", status_code=404)
    return row


async def get_owned_vendor_row(
    conn: asyncpg.Connection,
    user_id: int,
    vendor_id: int,
) -> asyncpg.Record:
    row = await vendor_repository.get_vendor(conn, vendor_id)
    if row is None or row["user_id"] != user_id:
        raise AppError("Vendor not found.", status_code=404)
    return row


async def resolve_transaction_kind_and_obligation(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    kind: str,
    obligation_id: int | None,
) -> tuple[str, int | None]:
    if obligation_id is not None:
        await get_owned_obligation_row(conn, user_id, obligation_id)
        return "subscription", obligation_id

    normalized_kind = normalize_transaction_kind(kind)
    if normalized_kind == "subscription":
        raise AppError(
            "Subscription transactions require an obligation.",
            status_code=400,
        )
    return normalized_kind, None


async def resolve_vendor_id(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    vendor_id: int | None,
    vendor_name: str | None,
    existing_vendor_id: int | None = None,
) -> int | None:
    if vendor_id is not None and vendor_name is not None:
        raise AppError(
            "Provide vendor_id or vendor_name, not both.",
            status_code=400,
        )

    if vendor_id is not None:
        await get_owned_vendor_row(conn, user_id, vendor_id)
        return vendor_id

    if vendor_name is not None:
        name = normalize_vendor_name(vendor_name)
        vendor = await vendor_repository.find_or_create_by_name(
            conn,
            user_id=user_id,
            name=name,
        )
        return vendor["id"]

    return existing_vendor_id


async def attach_transaction_cover(
    user_id: int,
    transaction_id: int,
    media_id: UUID,
) -> None:
    await media_service.create_attachment(
        user_id,
        media_id,
        MediaAttachmentCreate(
            entity_type="finance_transaction",
            entity_id=transaction_id,
            role="cover",
        ),
    )


async def attach_vendor_logo(
    user_id: int,
    vendor_id: int,
    media_id: UUID,
) -> None:
    await media_service.create_attachment(
        user_id,
        media_id,
        MediaAttachmentCreate(
            entity_type="finance_vendor",
            entity_id=vendor_id,
            role="logo",
        ),
    )


async def upload_and_attach_transaction_cover_from_bytes(
    user_id: int,
    transaction_id: int,
    *,
    filename: str,
    content_type: str,
    data: bytes,
) -> None:
    media = await media_service.upload_media(
        user_id,
        filename=filename,
        content_type=content_type,
        data=data,
    )
    await attach_transaction_cover(user_id, transaction_id, media.id)


async def upload_and_attach_vendor_logo_from_bytes(
    user_id: int,
    vendor_id: int,
    *,
    content_type: str,
    data: bytes,
    filename: str = "logo",
) -> None:
    media = await media_service.upload_media(
        user_id,
        filename=filename,
        content_type=content_type,
        data=data,
    )
    await attach_vendor_logo(user_id, vendor_id, media.id)
