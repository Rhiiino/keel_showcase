# keel_api/src/modules/games/service/sessions.py

"""Game session lifecycle — start, resume, autosave, complete, restart."""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from typing import Any

import asyncpg

from core.database import get_pool
from core.errors import AppError
from modules.games import config, repository
from modules.games.games.tower_of_hanoi import config as hanoi_config
from modules.games.games.tower_of_hanoi import state as hanoi_state
from modules.games.schemas import (
    GameSessionCompleteResponse,
    GameSessionCreate,
    GameSessionPatch,
    GameSessionPublic,
)
from modules.games.service import stats as stats_service



def _jsonb_dict(value: object) -> dict[str, Any]:
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (ValueError, TypeError):
            return {}
    if isinstance(value, dict):
        return dict(value)
    return {}


def _record_to_session(row: asyncpg.Record) -> GameSessionPublic:
    return GameSessionPublic(
        id=str(row["id"]),
        user_id=row["user_id"],
        game_key=row["game_key"],
        level=row["level"],
        status=row["status"],
        state=_jsonb_dict(row["state"]),
        move_count=row["move_count"],
        started_at=row["started_at"],
        completed_at=row["completed_at"],
        updated_at=row["updated_at"],
    )


def _assert_game_key(game_key: str) -> None:
    normalized = game_key.strip()
    if normalized not in config.REGISTERED_GAME_KEYS:
        raise AppError("Unknown game.", status_code=400)


def _assert_level(game_key: str, level: int) -> None:
    if level < 1:
        raise AppError("Level must be at least 1.", status_code=400)
    if game_key == "tower-of-hanoi" and not hanoi_config.is_valid_level(level):
        raise AppError(
            f"Level must be between 1 and {hanoi_config.MAX_LEVEL}.",
            status_code=400,
        )


def _initial_state_for_game(game_key: str, level: int) -> dict[str, Any]:
    if game_key == "tower-of-hanoi":
        return hanoi_state.build_initial_state(level)
    raise AppError("Unknown game.", status_code=400)


async def resume_session(user_id: int, game_key: str) -> GameSessionPublic:
    _assert_game_key(game_key)
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await repository.get_resume_session(
            conn,
            user_id=user_id,
            game_key=game_key,
        )
    if row is None:
        raise AppError("No in-progress session.", status_code=404)
    return _record_to_session(row)


async def get_active_session(
    user_id: int,
    game_key: str,
    level: int,
) -> GameSessionPublic:
    _assert_game_key(game_key)
    _assert_level(game_key, level)
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await repository.get_active_session_for_level(
            conn,
            user_id=user_id,
            game_key=game_key,
            level=level,
        )
    if row is None:
        raise AppError("No in-progress session for this level.", status_code=404)
    return _record_to_session(row)


async def start_session(user_id: int, payload: GameSessionCreate) -> GameSessionPublic:
    game_key = payload.game_key.strip()
    _assert_game_key(game_key)
    _assert_level(game_key, payload.level)

    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await repository.get_active_session_for_level(
            conn,
            user_id=user_id,
            game_key=game_key,
            level=payload.level,
        )
        if existing is not None:
            return _record_to_session(existing)

        state = _initial_state_for_game(game_key, payload.level)
        row = await repository.insert_session(
            conn,
            user_id=user_id,
            game_key=game_key,
            level=payload.level,
            state=state,
        )
    return _record_to_session(row)


async def patch_session(
    user_id: int,
    session_id: str,
    payload: GameSessionPatch,
) -> GameSessionPublic:
    parsed_id = _parse_session_id(session_id)
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await repository.update_session_state(
            conn,
            user_id=user_id,
            session_id=parsed_id,
            state=payload.state,
            move_count=payload.move_count,
        )
    if row is None:
        raise AppError("Session not found.", status_code=404)
    if row["status"] != "in_progress":
        raise AppError("Session is not in progress.", status_code=400)
    return _record_to_session(row)


async def restart_session(user_id: int, session_id: str) -> GameSessionPublic:
    parsed_id = _parse_session_id(session_id)
    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await repository.get_session(
            conn,
            user_id=user_id,
            session_id=parsed_id,
        )
        if existing is None:
            raise AppError("Session not found.", status_code=404)

        state = _initial_state_for_game(existing["game_key"], existing["level"])
        row = await repository.restart_session(
            conn,
            user_id=user_id,
            session_id=parsed_id,
            state=state,
        )
    if row is None:
        raise AppError("Session not found.", status_code=404)
    return _record_to_session(row)


async def complete_session(
    user_id: int,
    session_id: str,
    payload: GameSessionPatch,
) -> GameSessionCompleteResponse:
    parsed_id = _parse_session_id(session_id)
    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await repository.get_session(
            conn,
            user_id=user_id,
            session_id=parsed_id,
        )
        if existing is None:
            raise AppError("Session not found.", status_code=404)
        if existing["status"] != "in_progress":
            raise AppError("Session is not in progress.", status_code=400)

        game_key = existing["game_key"]
        level = existing["level"]
        if game_key == "tower-of-hanoi" and not hanoi_state.is_winning_state(
            payload.state,
            level=level,
        ):
            raise AppError("Level is not complete.", status_code=400)

        completed_at = datetime.now(tz=UTC)
        duration_ms = hanoi_state.compute_duration_ms(
            payload.state,
            completed_at=completed_at,
        )

        row = await repository.complete_session(
            conn,
            user_id=user_id,
            session_id=parsed_id,
            state=payload.state,
            move_count=payload.move_count,
        )
        if row is None:
            raise AppError("Session not found.", status_code=404)

        await stats_service.record_level_completion(
            conn,
            user_id=user_id,
            game_key=game_key,
            level=level,
            duration_ms=duration_ms,
            move_count=payload.move_count,
        )

    session = _record_to_session(row)
    next_level: int | None = None
    if game_key == "tower-of-hanoi" and level < hanoi_config.MAX_LEVEL:
        next_level = level + 1

    return GameSessionCompleteResponse(
        session=session,
        duration_ms=duration_ms,
        next_level=next_level,
    )


def _parse_session_id(session_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(session_id)
    except ValueError as exc:
        raise AppError("Invalid session id.", status_code=400) from exc
