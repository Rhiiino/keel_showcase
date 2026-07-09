# keel_api/src/modules/games/repository/sessions.py

"""SQL access for game_sessions."""

from __future__ import annotations

import json
import uuid
from typing import Any

import asyncpg

from core.tables import GAME_SESSIONS

_SESSION_COLUMNS = (
    "id, user_id, game_key, level, status, state, move_count, "
    "started_at, completed_at, updated_at"
)

_SESSION_RETURNING = _SESSION_COLUMNS



def _jsonb_dict(value: object) -> dict[str, Any]:
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (ValueError, TypeError):
            return {}
    if isinstance(value, dict):
        return dict(value)
    return {}



# ----- Game sessions table operations
async def get_resume_session(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    game_key: str,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        SELECT {_SESSION_COLUMNS}
        FROM {GAME_SESSIONS}
        WHERE user_id = $1
          AND game_key = $2
          AND status = 'in_progress'
        ORDER BY updated_at DESC
        LIMIT 1
        """,
        user_id,
        game_key,
    )


async def get_active_session_for_level(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    game_key: str,
    level: int,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        SELECT {_SESSION_COLUMNS}
        FROM {GAME_SESSIONS}
        WHERE user_id = $1
          AND game_key = $2
          AND level = $3
          AND status = 'in_progress'
        """,
        user_id,
        game_key,
        level,
    )


async def get_session(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    session_id: uuid.UUID,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        SELECT {_SESSION_COLUMNS}
        FROM {GAME_SESSIONS}
        WHERE user_id = $1 AND id = $2
        """,
        user_id,
        session_id,
    )


async def insert_session(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    game_key: str,
    level: int,
    state: dict[str, Any],
) -> asyncpg.Record:
    return await conn.fetchrow(
        f"""
        INSERT INTO {GAME_SESSIONS} (user_id, game_key, level, state)
        VALUES ($1, $2, $3, $4::jsonb)
        RETURNING {_SESSION_RETURNING}
        """,
        user_id,
        game_key,
        level,
        json.dumps(state),
    )


async def update_session_state(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    session_id: uuid.UUID,
    state: dict[str, Any],
    move_count: int,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        UPDATE {GAME_SESSIONS}
        SET
            state = $3::jsonb,
            move_count = $4,
            updated_at = NOW()
        WHERE user_id = $1 AND id = $2
        RETURNING {_SESSION_RETURNING}
        """,
        user_id,
        session_id,
        json.dumps(state),
        move_count,
    )


async def restart_session(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    session_id: uuid.UUID,
    state: dict[str, Any],
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        UPDATE {GAME_SESSIONS}
        SET
            state = $3::jsonb,
            move_count = 0,
            status = 'in_progress',
            started_at = NOW(),
            completed_at = NULL,
            updated_at = NOW()
        WHERE user_id = $1 AND id = $2
        RETURNING {_SESSION_RETURNING}
        """,
        user_id,
        session_id,
        json.dumps(state),
    )


async def complete_session(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    session_id: uuid.UUID,
    state: dict[str, Any],
    move_count: int,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        UPDATE {GAME_SESSIONS}
        SET
            state = $3::jsonb,
            move_count = $4,
            status = 'completed',
            completed_at = NOW(),
            updated_at = NOW()
        WHERE user_id = $1 AND id = $2
        RETURNING {_SESSION_RETURNING}
        """,
        user_id,
        session_id,
        json.dumps(state),
        move_count,
    )
