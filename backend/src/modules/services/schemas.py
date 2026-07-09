# keel_api/src/modules/services/schemas.py

"""Pydantic models for the services API."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

ServiceStatus = Literal["up", "down", "caution"]
ServiceType = Literal["frontend", "backend"]


class ServicePublic(BaseModel):
    id: int
    user_id: int
    service_name: str
    url: str
    service_type: ServiceType
    description: str | None = None
    check_enabled: bool
    expected_status_code: int
    failure_threshold: int
    last_status: ServiceStatus | None = None
    last_checked_at: datetime | None = None
    response_time_ms: int | None = None
    status_code: int | None = None
    error_message: str | None = None
    consecutive_failures: int
    created_at: datetime
    updated_at: datetime


class ServiceCreate(BaseModel):
    service_name: str = Field(..., min_length=1, max_length=200)
    url: str = Field(..., min_length=1, max_length=2048)
    service_type: ServiceType = "frontend"
    description: str | None = Field(default=None, max_length=2000)
    check_enabled: bool = True
    expected_status_code: int = Field(default=200, ge=100, le=599)
    failure_threshold: int = Field(default=3, ge=1)


class ServiceUpdate(BaseModel):
    service_name: str | None = Field(default=None, min_length=1, max_length=200)
    url: str | None = Field(default=None, min_length=1, max_length=2048)
    service_type: ServiceType | None = None
    description: str | None = Field(default=None, max_length=2000)
    check_enabled: bool | None = None
    expected_status_code: int | None = Field(default=None, ge=100, le=599)
    failure_threshold: int | None = Field(default=None, ge=1)
