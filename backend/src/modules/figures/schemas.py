# keel_api/src/modules/figures/schemas.py

"""Pydantic models for figures."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field

from modules.media.schemas import MediaPublic


class FigureCreate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    gender: str | None = None
    birth_date: date | None = None
    birth_date_year_known: bool = True
    death_date: date | None = None
    notes: str = ""
    status: str = "active"


class FigureUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    gender: str | None = None
    birth_date: date | None = None
    birth_date_year_known: bool | None = None
    death_date: date | None = None
    notes: str | None = None
    status: str | None = None


class FigurePublic(BaseModel):
    id: int
    first_name: str | None
    last_name: str | None
    gender: str | None
    birth_date: date | None
    birth_date_year_known: bool
    death_date: date | None
    notes: str
    status: str
    photo: MediaPublic | None = None
    created_at: datetime
    updated_at: datetime
