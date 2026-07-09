# keel_api/src/modules/games/repository/stats.py

"""SQL access for game_stats."""

from __future__ import annotations

import json
from typing import Any

import asyncpg

from core.tables import GAME_STATS

_STATS_COLUMNS = "user_id, game_key, stats, updated_at"



# ----- Game stats table operations
async def get_stats(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    game_key: str,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"""
        SELECT {_STATS_COLUMNS}
        FROM {GAME_STATS}
        WHERE user_id = $1 AND game_key = $2
        """,
        user_id,
        game_key,
    )


async def upsert_stats(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    game_key: str,
    stats: dict[str, Any],
) -> asyncpg.Record:
    return await conn.fetchrow(
        f"""
        INSERT INTO {GAME_STATS} (user_id, game_key, stats)
        VALUES ($1, $2, $3::jsonb)
        ON CONFLICT (user_id, game_key)
        DO UPDATE SET
            stats = EXCLUDED.stats,
            updated_at = NOW()
        RETURNING {_STATS_COLUMNS}
        """,
        user_id,
        game_key,
        json.dumps(stats),
    )
