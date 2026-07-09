# keel_api/src/modules/games/router.py

"""HTTP routes for solo mini-games (session required)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.games import config
from modules.games.schemas import (
    GameSessionCompleteResponse,
    GameSessionCreate,
    GameSessionPatch,
    GameSessionPublic,
    GameStatsPublic,
)
from modules.games.service import (
    complete_session,
    get_active_session,
    get_game_stats,
    patch_session,
    restart_session,
    resume_session,
    start_session,
)

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]



# ----- Game stats
@router.get(config.STATS_PATH, response_model=GameStatsPublic)
async def read_game_stats(
    user: CurrentUser,
    game_key: str = Query(..., min_length=1),
) -> GameStatsPublic:
    """Return personal stats for one game."""
    return await get_game_stats(user.id, game_key)



# ----- Game sessions
@router.get(config.SESSION_RESUME_PATH, response_model=GameSessionPublic)
async def read_resume_session(
    user: CurrentUser,
    game_key: str = Query(..., min_length=1),
) -> GameSessionPublic:
    """Return the most recent in-progress session for a game."""
    return await resume_session(user.id, game_key)


@router.get(config.SESSION_ACTIVE_PATH, response_model=GameSessionPublic)
async def read_active_session(
    user: CurrentUser,
    game_key: str = Query(..., min_length=1),
    level: int = Query(..., ge=1),
) -> GameSessionPublic:
    """Return the in-progress session for a specific level."""
    return await get_active_session(user.id, game_key, level)


@router.post(
    config.SESSIONS_PATH,
    response_model=GameSessionPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_game_session(
    payload: GameSessionCreate,
    user: CurrentUser,
) -> GameSessionPublic:
    """Start or resume a level session."""
    return await start_session(user.id, payload)


@router.patch(config.SESSION_BY_ID_PATH, response_model=GameSessionPublic)
async def update_game_session(
    session_id: str,
    payload: GameSessionPatch,
    user: CurrentUser,
) -> GameSessionPublic:
    """Autosave session state."""
    return await patch_session(user.id, session_id, payload)


@router.post(
    config.SESSION_COMPLETE_PATH,
    response_model=GameSessionCompleteResponse,
)
async def finish_game_session(
    session_id: str,
    payload: GameSessionPatch,
    user: CurrentUser,
) -> GameSessionCompleteResponse:
    """Mark a level complete and update personal stats."""
    return await complete_session(user.id, session_id, payload)


@router.post(config.SESSION_RESTART_PATH, response_model=GameSessionPublic)
async def reset_game_session(
    session_id: str,
    user: CurrentUser,
) -> GameSessionPublic:
    """Restart the current level from the initial layout."""
    return await restart_session(user.id, session_id)
