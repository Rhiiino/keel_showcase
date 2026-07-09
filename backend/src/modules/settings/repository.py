# stack_sandbox/backend/src/modules/preferences/repository.py
"""SQL access for per-user preference documents."""

from __future__ import annotations

import json

import asyncpg

from core.tables import USER_PREFERENCES

_RETURNING = "user_id, data, updated_at"



# ----- User preferences table operations
async def get_user_preferences(
    conn: asyncpg.Connection,
    user_id: int,
) -> asyncpg.Record | None:
    """Fetch the preferences row for a user."""
    return await conn.fetchrow(
        f"""
        SELECT {_RETURNING}
        FROM {USER_PREFERENCES}
        WHERE user_id = $1
        """,
        user_id,
    )


async def upsert_user_preferences(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    data: dict,
) -> asyncpg.Record:
    """Insert or replace the preferences document for a user."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {USER_PREFERENCES} (user_id, data)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (user_id) DO UPDATE
        SET
            data = EXCLUDED.data,
            updated_at = NOW()
        RETURNING {_RETURNING}
        """,
        user_id,
        json.dumps(data),
    )
    if row is None:
        raise RuntimeError("Failed to upsert user preferences.")
    return row
