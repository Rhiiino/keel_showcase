# keel_api/src/modules/coak/service/helpers.py

"""Shared validation and mapping helpers for Coak service."""

from __future__ import annotations

import re

import asyncpg

from core.errors import AppError
from modules.coak import config
from modules.coak.schemas import CoakItemPublic, CoakRecordPublic, CoakTagPublic

_HEX_COLOR_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")
def normalize_name(name: str, *, field_name: str = "name") -> str:
    normalized = name.strip()
    if not normalized:
        raise AppError(f"{field_name} cannot be empty.", status_code=400)
    if len(normalized) > 256:
        raise AppError(f"{field_name} must be at most 256 characters.", status_code=400)
    return normalized


def normalize_color_hex(
    color_hex: str | None,
    *,
    default: str = config.DEFAULT_ITEM_COLOR_HEX,
) -> str:
    if color_hex is None:
        return default
    normalized = color_hex.strip()
    if not normalized:
        return default
    if not _HEX_COLOR_PATTERN.fullmatch(normalized):
        raise AppError("color_hex must be a six-digit hex color like #06B6D4.", status_code=400)
    return normalized.upper()


def normalize_kind(kind: str) -> str:
    normalized = kind.strip().lower()
    if normalized not in config.COAK_ITEM_KINDS:
        raise AppError(
            f"kind must be one of: {', '.join(sorted(config.COAK_ITEM_KINDS))}.",
            status_code=400,
        )
    return normalized


def record_to_public(row: asyncpg.Record) -> CoakRecordPublic:
    return CoakRecordPublic(
        id=int(row["id"]),
        name=row["name"],
        color_hex=row["color_hex"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def item_to_public(
    row: asyncpg.Record,
    *,
    tags: list[CoakTagPublic] | None = None,
) -> CoakItemPublic:
    return CoakItemPublic(
        id=int(row["id"]),
        coak_record_id=int(row["coak_record_id"]),
        parent_id=int(row["parent_id"]) if row["parent_id"] is not None else None,
        kind=row["kind"],
        name=row["name"],
        color_hex=row["color_hex"],
        sort_order=int(row["sort_order"]),
        media_id=row["media_id"],
        note_body=row["note_body"],
        flash_front=row["flash_front"],
        flash_back=row["flash_back"],
        tags=tags or [],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


async def assert_owned_record(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
) -> asyncpg.Record:
    from modules.coak.repository import records as records_repository

    row = await records_repository.get_record(conn, user_id=user_id, record_id=record_id)
    if row is None:
        raise AppError("Coak record not found.", status_code=404)
    return row


