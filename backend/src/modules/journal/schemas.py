# keel_api/src/modules/journal/schemas.py

"""Pydantic models for the journal API."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field


class JournalTagPublic(BaseModel):
    id: int
    name: str
    color_hex: str
    entry_count: int = 0


class JournalTagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    color_hex: str | None = None


class JournalTagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    color_hex: str | None = None


class JournalEntryPublic(BaseModel):
    id: int
    user_id: int
    entry_date: date
    content: str
    tags: list[JournalTagPublic] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class JournalEntryCreate(BaseModel):
    entry_date: date
    content: str = Field(..., min_length=1, max_length=80000)
    tag_ids: list[int] = Field(default_factory=list)


class JournalEntryUpdate(BaseModel):
    entry_date: date | None = None
    content: str | None = Field(default=None, min_length=1, max_length=80000)
    tag_ids: list[int] | None = None
