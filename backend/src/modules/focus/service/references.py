# keel_api/src/modules/focus/service/references.py

"""Reference type listing, search, detail, and user settings."""

from __future__ import annotations

from core.database import get_pool
from core.errors import AppError
from modules.focus import reference_registry
from modules.focus.schemas import (
    FocusReferenceDetailPublic,
    FocusReferencePropertyPublic,
    FocusReferenceSearchResult,
    FocusReferenceSettingsPublic,
    FocusReferenceSettingsUpdate,
    FocusReferenceTypePublic,
)
from modules.focus.service.helpers import (
    read_reference_enabled_types,
    write_reference_enabled_types,
)



async def list_reference_types(user_id: int) -> list[FocusReferenceTypePublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        enabled_types = set(await read_reference_enabled_types(conn, user_id))
    return [
        FocusReferenceTypePublic(
            target_type=meta.target_type,
            display_name=meta.display_name,
            user_scoped=meta.user_scoped,
            enabled=meta.target_type in enabled_types,
        )
        for meta in reference_registry.all_reference_type_metas()
    ]


async def search_references(
    user_id: int,
    *,
    target_type: str,
    query: str,
) -> list[FocusReferenceSearchResult]:
    normalized_type = target_type.strip().lower()
    meta = reference_registry.get_reference_type_meta(normalized_type)
    if meta is None:
        raise AppError("Unknown reference type.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        enabled_types = set(await read_reference_enabled_types(conn, user_id))
        if normalized_type not in enabled_types:
            raise AppError("Reference type is disabled.", status_code=400)
        rows = await reference_registry.search_reference_targets(
            conn,
            user_id=user_id,
            target_type=normalized_type,
            query=query,
        )
    return [
        FocusReferenceSearchResult(
            target_type=str(row["target_type"]),
            target_id=str(row["target_id"]),
            title=str(row["title"]),
            subtitle=str(row["subtitle"]) if row.get("subtitle") is not None else None,
        )
        for row in rows
    ]


async def get_reference_detail(
    user_id: int,
    *,
    target_type: str,
    target_id: str,
) -> FocusReferenceDetailPublic:
    normalized_type = target_type.strip().lower()
    if reference_registry.get_reference_type_meta(normalized_type) is None:
        raise AppError("Unknown reference type.", status_code=400)
    normalized_id = str(target_id).strip()
    if not normalized_id:
        raise AppError("Invalid reference target id.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        enabled_types = set(await read_reference_enabled_types(conn, user_id))
        if normalized_type not in enabled_types:
            raise AppError("Reference type is disabled.", status_code=400)
        detail = await reference_registry.get_reference_detail(
            conn,
            user_id=user_id,
            target_type=normalized_type,
            target_id=normalized_id,
        )

    return FocusReferenceDetailPublic(
        target_type=str(detail["target_type"]),
        target_id=str(detail["target_id"]),
        title=str(detail["title"]),
        is_missing=bool(detail.get("is_missing", False)),
        properties=[
            FocusReferencePropertyPublic(
                key=str(prop["key"]),
                label=str(prop["label"]),
                value=str(prop["value"]),
            )
            for prop in detail.get("properties", [])
        ],
    )


async def get_reference_settings(user_id: int) -> FocusReferenceSettingsPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        enabled_types = await read_reference_enabled_types(conn, user_id)
    return FocusReferenceSettingsPublic(reference_enabled_types=enabled_types)


async def update_reference_settings(
    user_id: int,
    payload: FocusReferenceSettingsUpdate,
) -> FocusReferenceSettingsPublic:
    normalized = reference_registry.normalize_enabled_types(payload.reference_enabled_types)
    if not normalized:
        raise AppError("At least one reference type must remain enabled.", status_code=400)
    for target_type in normalized:
        if reference_registry.get_reference_type_meta(target_type) is None:
            raise AppError("Unknown reference type in settings.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        await write_reference_enabled_types(
            conn,
            user_id=user_id,
            enabled_types=normalized,
        )
    return FocusReferenceSettingsPublic(reference_enabled_types=normalized)
