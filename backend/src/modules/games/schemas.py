# keel_api/src/modules/games/schemas.py

"""Pydantic models for the games API."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class GameSessionPublic(BaseModel):
    id: str
    user_id: int
    game_key: str
    level: int
    status: str
    state: dict[str, Any]
    move_count: int
    started_at: datetime
    completed_at: datetime | None = None
    updated_at: datetime


class GameSessionCreate(BaseModel):
    game_key: str = Field(..., min_length=1, max_length=80)
    level: int = Field(..., ge=1)


class GameSessionPatch(BaseModel):
    state: dict[str, Any]
    move_count: int = Field(..., ge=0)


class GameSessionCompleteResponse(BaseModel):
    session: GameSessionPublic
    duration_ms: int
    next_level: int | None = None


class GameStatsPublic(BaseModel):
    game_key: str
    stats: dict[str, Any]
    updated_at: datetime
