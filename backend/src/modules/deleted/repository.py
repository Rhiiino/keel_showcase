# keel_api/src/modules/deleted/repository.py
"""SQL for deleted_records trash rows."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any
from uuid import UUID

import asyncpg

from core.tables import DELETED_RECORDS

_COLUMNS = """
    id,
    user_id,
    entity_type,
    entity_id,
    display_label,
    payload,
    purge_group_id,
    deleted_at,
    expires_at,
    permanently_deleted_at
"""


async def insert_deleted_record(
    conn: asyncpg.Connection,
    *,
    record_id: UUID,
    user_id: int,
    entity_type: str,
    entity_id: str,
    display_label: str,
    payload: dict[str, Any],
    expires_at: datetime,
    purge_group_id: UUID | None = None,
) -> asyncpg.Record:
    return await conn.fetchrow(
        f"""
        INSERT INTO {DELETED_RECORDS} (
            id,
            user_id,
            entity_type,
            entity_id,
            display_label,
            payload,
            purge_group_id,
            expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
        RETURNING {_COLUMNS}
        """,
        record_id,
        user_id,
        entity_type,
        entity_id,
        display_label,
        json.dumps(payload),
        purge_group_id,
        expires_at,
    )


async def list_active_deleted_records(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    entity_type: str | None = None,
) -> list[asyncpg.Record]:
    if entity_type is None:
        return await conn.fetch(
            f"""
            SELECT {_COLUMNS}
            FROM {DELETED_RECORDS}
            WHERE user_id = $1
              AND permanently_deleted_at IS NULL
            ORDER BY deleted_at DESC, id DESC
            """,
            user_id,
        )
    return await conn.fetch(
        f"""
        SELECT {_COLUMNS}
        FROM {DELETED_RECORDS}
        WHERE user_id = $1
          AND entity_type = $2
          AND permanently_deleted_at IS NULL
        ORDER BY deleted_at DESC, id DESC
        """,
        user_id,
        entity_type,
    )


async def get_active_deleted_record(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: UUID,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        SELECT {_COLUMNS}
        FROM {DELETED_RECORDS}
        WHERE id = $1
          AND user_id = $2
          AND permanently_deleted_at IS NULL
        """,
        record_id,
        user_id,
    )


async def list_active_by_purge_group(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    purge_group_id: UUID,
) -> list[asyncpg.Record]:
    return await conn.fetch(
        f"""
        SELECT {_COLUMNS}
        FROM {DELETED_RECORDS}
        WHERE user_id = $1
          AND purge_group_id = $2
          AND permanently_deleted_at IS NULL
        ORDER BY deleted_at ASC, id ASC
        """,
        user_id,
        purge_group_id,
    )


async def mark_permanently_deleted(
    conn: asyncpg.Connection,
    *,
    record_id: UUID,
    deleted_at: datetime,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        UPDATE {DELETED_RECORDS}
        SET permanently_deleted_at = $2
        WHERE id = $1
          AND permanently_deleted_at IS NULL
        RETURNING {_COLUMNS}
        """,
        record_id,
        deleted_at,
    )


async def list_expired_active_records(
    conn: asyncpg.Connection,
    *,
    before: datetime,
    limit: int = 200,
) -> list[asyncpg.Record]:
    return await conn.fetch(
        f"""
        SELECT {_COLUMNS}
        FROM {DELETED_RECORDS}
        WHERE permanently_deleted_at IS NULL
          AND expires_at <= $1
        ORDER BY expires_at ASC, id ASC
        LIMIT $2
        """,
        before,
        limit,
    )
