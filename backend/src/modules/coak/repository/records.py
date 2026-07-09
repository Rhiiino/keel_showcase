# keel_api/src/modules/coak/repository/records.py

"""SQL access for coak_records."""

from __future__ import annotations

import json
from typing import Any

import asyncpg

from core.tables import COAK_RECORDS

_RECORD_COLUMNS = "id, user_id, name, color_hex, created_at, updated_at"



def _jsonb_dict(value: object) -> dict[str, Any]:
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (ValueError, TypeError):
            return {}
    if isinstance(value, dict):
        return dict(value)
    return {}

async def list_records(conn: asyncpg.Connection, *, user_id: int) -> list[asyncpg.Record]:
    return await conn.fetch(
        f"""
        SELECT {_RECORD_COLUMNS}
        FROM {COAK_RECORDS}
        WHERE user_id = $1
        ORDER BY updated_at DESC, id DESC
        """,
        user_id,
    )


async def get_record(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        SELECT {_RECORD_COLUMNS}
        FROM {COAK_RECORDS}
        WHERE user_id = $1 AND id = $2
        """,
        user_id,
        record_id,
    )


async def insert_record(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    name: str,
    color_hex: str,
) -> asyncpg.Record:
    return await conn.fetchrow(
        f"""
        INSERT INTO {COAK_RECORDS} (user_id, name, color_hex)
        VALUES ($1, $2, $3)
        RETURNING {_RECORD_COLUMNS}
        """,
        user_id,
        name,
        color_hex,
    )


async def update_record(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
    name: str | None,
    color_hex: str | None,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        UPDATE {COAK_RECORDS}
        SET
            name = COALESCE($3, name),
            color_hex = COALESCE($4, color_hex),
            updated_at = NOW()
        WHERE user_id = $1 AND id = $2
        RETURNING {_RECORD_COLUMNS}
        """,
        user_id,
        record_id,
        name,
        color_hex,
    )


async def delete_record(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
) -> bool:
    result = await conn.execute(
        f"""
        DELETE FROM {COAK_RECORDS}
        WHERE user_id = $1 AND id = $2
        """,
        user_id,
        record_id,
    )
    return result.endswith("1")



# ----- Record workspace columns
async def get_workspace_state(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        f"""
        SELECT workspace_state
        FROM {COAK_RECORDS}
        WHERE user_id = $1 AND id = $2
        """,
        user_id,
        record_id,
    )
    if row is None:
        return None
    return _jsonb_dict(row["workspace_state"])


async def update_workspace_state(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
    workspace_state: dict[str, Any],
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        f"""
        UPDATE {COAK_RECORDS}
        SET workspace_state = $3::jsonb
        WHERE user_id = $1 AND id = $2
        RETURNING workspace_state
        """,
        user_id,
        record_id,
        json.dumps(workspace_state),
    )
    if row is None:
        return None
    return _jsonb_dict(row["workspace_state"])


async def get_workspace_settings(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        f"""
        SELECT workspace_settings
        FROM {COAK_RECORDS}
        WHERE user_id = $1 AND id = $2
        """,
        user_id,
        record_id,
    )
    if row is None:
        return None
    return _jsonb_dict(row["workspace_settings"])


async def update_workspace_settings(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
    workspace_settings: dict[str, Any],
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        f"""
        UPDATE {COAK_RECORDS}
        SET workspace_settings = $3::jsonb
        WHERE user_id = $1 AND id = $2
        RETURNING workspace_settings
        """,
        user_id,
        record_id,
        json.dumps(workspace_settings),
    )
    if row is None:
        return None
    return _jsonb_dict(row["workspace_settings"])


async def get_configuration_settings(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        f"""
        SELECT configuration_settings
        FROM {COAK_RECORDS}
        WHERE user_id = $1 AND id = $2
        """,
        user_id,
        record_id,
    )
    if row is None:
        return None
    return _jsonb_dict(row["configuration_settings"])


async def update_configuration_settings(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    record_id: int,
    configuration_settings: dict[str, Any],
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        f"""
        UPDATE {COAK_RECORDS}
        SET configuration_settings = $3::jsonb
        WHERE user_id = $1 AND id = $2
        RETURNING configuration_settings
        """,
        user_id,
        record_id,
        json.dumps(configuration_settings),
    )
    if row is None:
        return None
    return _jsonb_dict(row["configuration_settings"])
