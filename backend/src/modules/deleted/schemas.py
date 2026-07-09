# keel_api/src/modules/deleted/schemas.py
"""Pydantic models for recently-deleted HTTP API."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DeletedConfigPublic(BaseModel):
    retention_days: int
    purge_schedule_hint: str


class DeletedRecordPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    entity_type: str
    entity_id: str
    display_label: str
    purge_group_id: UUID | None
    deleted_at: datetime
    expires_at: datetime
    permanently_deleted_at: datetime | None


class DeletedRecordDetailPublic(DeletedRecordPublic):
    payload: dict[str, Any] = Field(default_factory=dict)


class DeletedRestoreResultPublic(BaseModel):
    entity_type: str
    entity_id: str
