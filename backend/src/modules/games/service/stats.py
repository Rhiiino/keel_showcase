# keel_api/src/modules/games/service/stats.py

"""Personal game stats aggregation."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

import asyncpg

from core.database import get_pool
from modules.games import config, repository
from modules.games.schemas import GameStatsPublic

STATS_VERSION = 1



def _jsonb_dict(value: object) -> dict[str, Any]:
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (ValueError, TypeError):
            return {}
    if isinstance(value, dict):
        return dict(value)
    return {}


def _record_to_stats(row: asyncpg.Record) -> GameStatsPublic:
    return GameStatsPublic(
        game_key=row["game_key"],
        stats=_jsonb_dict(row["stats"]),
        updated_at=row["updated_at"],
    )


def empty_stats() -> dict[str, Any]:
    return {"version": STATS_VERSION, "levels": {}}


async def get_game_stats(user_id: int, game_key: str) -> GameStatsPublic:
    _assert_game_key(game_key)
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await repository.get_stats(conn, user_id=user_id, game_key=game_key)
    if row is None:
        return GameStatsPublic(
            game_key=game_key,
            stats=empty_stats(),
            updated_at=datetime.now(tz=UTC),
        )
    return _record_to_stats(row)


async def record_level_completion(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    game_key: str,
    level: int,
    duration_ms: int,
    move_count: int,
) -> None:
    row = await repository.get_stats(conn, user_id=user_id, game_key=game_key)
    stats = _jsonb_dict(row["stats"]) if row is not None else empty_stats()
    levels = stats.get("levels")
    if not isinstance(levels, dict):
        levels = {}

    level_key = str(level)
    existing = levels.get(level_key)
    if not isinstance(existing, dict):
        existing = {}

    best_time = existing.get("bestTimeMs")
    best_moves = existing.get("bestMoveCount")
    completions = existing.get("completions")

    next_entry = {
        "bestTimeMs": duration_ms
        if not isinstance(best_time, int) or duration_ms < best_time
        else best_time,
        "bestMoveCount": move_count
        if not isinstance(best_moves, int) or move_count < best_moves
        else best_moves,
        "completions": (int(completions) if isinstance(completions, int) else 0) + 1,
        "lastCompletedAt": datetime.now(tz=UTC).isoformat(),
    }
    levels[level_key] = next_entry
    stats["version"] = STATS_VERSION
    stats["levels"] = levels

    await repository.upsert_stats(
        conn,
        user_id=user_id,
        game_key=game_key,
        stats=stats,
    )


def _assert_game_key(game_key: str) -> None:
    from core.errors import AppError

    normalized = game_key.strip()
    if normalized not in config.REGISTERED_GAME_KEYS:
        raise AppError("Unknown game.", status_code=400)
