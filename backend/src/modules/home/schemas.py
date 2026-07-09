# stack_sandbox/backend/src/modules/home/schemas.py
"""Pydantic models for home screen content."""

from __future__ import annotations

from pydantic import BaseModel, Field


class QuotePublic(BaseModel):
    id: int
    text: str = Field(min_length=1)
    author: str = Field(min_length=1)
