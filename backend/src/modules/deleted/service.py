# keel_api/src/modules/deleted/service.py
"""Orchestration for global recently-deleted trash rows."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from core.config import get_settings
from core.database import get_pool
from core.errors import AppError
from modules.deleted import config, repository
from modules.deleted.handlers import get_handler
from modules.deleted.schemas import (
    DeletedConfigPublic,
    DeletedRecordDetailPublic,
    DeletedRecordPublic,
    DeletedRestoreResultPublic,
)


def _decode_jsonb_payload(value: object) -> dict:
    if value is None:
        return {}
    if isinstance(value, dict):
        return dict(value)
    if isinstance(value, str):
        parsed = json.loads(value)
        if isinstance(parsed, dict):
            return parsed
    raise ValueError("Deleted record payload must be a JSON object.")


def _record_to_public(row) -> DeletedRecordPublic:
    return DeletedRecordPublic(
        id=row["id"],
        entity_type=row["entity_type"],
        entity_id=row["entity_id"],
        display_label=row["display_label"],
        purge_group_id=row["purge_group_id"],
        deleted_at=row["deleted_at"],
        expires_at=row["expires_at"],
        permanently_deleted_at=row["permanently_deleted_at"],
    )


def _expires_at_from_now() -> datetime:
    settings = get_settings()
    return datetime.now(UTC) + timedelta(days=settings.recently_deleted_retention_days)



# ----- Config
async def get_deleted_config() -> DeletedConfigPublic:
    settings = get_settings()
    return DeletedConfigPublic(
        retention_days=settings.recently_deleted_retention_days,
        purge_schedule_hint=config.PURGE_SCHEDULE_HINT,
    )



# ----- Trash lifecycle
async def trash_entity(
    user_id: int,
    entity_type: str,
    entity_id: str,
    *,
    purge_group_id: UUID | None = None,
) -> UUID:
    """Capture, store, and hard-delete one entity."""
    handler = get_handler(entity_type)
    record_id = uuid4()
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            capture = await handler.capture(
                conn,
                user_id=user_id,
                entity_id=entity_id,
            )
            await repository.insert_deleted_record(
                conn,
                record_id=record_id,
                user_id=user_id,
                entity_type=entity_type,
                entity_id=entity_id,
                display_label=capture.display_label,
                payload=capture.payload,
                expires_at=_expires_at_from_now(),
                purge_group_id=purge_group_id,
            )
            await handler.delete_source(
                conn,
                user_id=user_id,
                entity_id=entity_id,
            )
    return record_id


async def list_deleted_records(
    user_id: int,
    *,
    entity_type: str | None = None,
) -> list[DeletedRecordPublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_active_deleted_records(
            conn,
            user_id=user_id,
            entity_type=entity_type,
        )
    return [_record_to_public(row) for row in rows]


async def get_deleted_record(user_id: int, record_id: UUID) -> DeletedRecordDetailPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.get_active_deleted_record(
            conn,
            user_id=user_id,
            record_id=record_id,
        )
    if row is None:
        raise AppError("Deleted record not found.", status_code=404)
    public = _record_to_public(row)
    return DeletedRecordDetailPublic(
        **public.model_dump(),
        payload=_decode_jsonb_payload(row["payload"]),
    )


async def restore_deleted_record(user_id: int, record_id: UUID) -> DeletedRestoreResultPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await repository.get_active_deleted_record(
                conn,
                user_id=user_id,
                record_id=record_id,
            )
            if row is None:
                raise AppError("Deleted record not found.", status_code=404)
            if row["expires_at"] <= datetime.now(UTC):
                raise AppError("Deleted record has expired and cannot be restored.", status_code=410)
            rows_to_restore = [row]
            if row["purge_group_id"] is not None:
                rows_to_restore = await repository.list_active_by_purge_group(
                    conn,
                    user_id=user_id,
                    purge_group_id=row["purge_group_id"],
                )
            restored_entity_id = ""
            restored_entity_type = row["entity_type"]
            for trash_row in rows_to_restore:
                handler = get_handler(trash_row["entity_type"])
                restored_entity_id = await handler.restore(
                    conn,
                    user_id=user_id,
                    payload=_decode_jsonb_payload(trash_row["payload"]),
                )
                restored_entity_type = trash_row["entity_type"]
                await repository.mark_permanently_deleted(
                    conn,
                    record_id=trash_row["id"],
                    deleted_at=datetime.now(UTC),
                )
    return DeletedRestoreResultPublic(
        entity_type=restored_entity_type,
        entity_id=restored_entity_id,
    )


async def purge_deleted_record(user_id: int, record_id: UUID) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await repository.get_active_deleted_record(
                conn,
                user_id=user_id,
                record_id=record_id,
            )
            if row is None:
                raise AppError("Deleted record not found.", status_code=404)
            rows_to_purge = [row]
            if row["purge_group_id"] is not None:
                rows_to_purge = await repository.list_active_by_purge_group(
                    conn,
                    user_id=user_id,
                    purge_group_id=row["purge_group_id"],
                )
            for trash_row in rows_to_purge:
                handler = get_handler(trash_row["entity_type"])
                await handler.purge(
                    conn,
                    user_id=user_id,
                    payload=_decode_jsonb_payload(trash_row["payload"]),
                )
                await repository.mark_permanently_deleted(
                    conn,
                    record_id=trash_row["id"],
                    deleted_at=datetime.now(UTC),
                )


async def purge_expired_deleted_records() -> dict[str, int]:
    """Delete trash rows whose retention period has elapsed."""
    pool = get_pool()
    purged_count = 0
    now = datetime.now(UTC)
    while True:
        async with pool.acquire() as conn:
            rows = await repository.list_expired_active_records(conn, before=now, limit=100)
        if not rows:
            break
        for row in rows:
            async with pool.acquire() as conn:
                async with conn.transaction():
                    handler = get_handler(row["entity_type"])
                    await handler.purge(
                        conn,
                        user_id=row["user_id"],
                        payload=_decode_jsonb_payload(row["payload"]),
                    )
                    await repository.mark_permanently_deleted(
                        conn,
                        record_id=row["id"],
                        deleted_at=now,
                    )
            purged_count += 1
    return {"purged_count": purged_count}
