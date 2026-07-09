# keel_api/src/modules/connectors/schemas.py

"""Shared connector DTOs."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ConnectorActorPublic(BaseModel):
    type: str
    label: str


class ConnectorAutomationEventPublic(BaseModel):
    event: str
    actor: ConnectorActorPublic
    call_id: str | None = None
    tool_name: str | None = None
    started_at: datetime | None = None
    duration_ms: int | None = None
    arguments_summary: str | None = None
    result_summary: str | None = None
    error_code: str | None = None
    message: str | None = None
    node_ids: list[int] = Field(default_factory=list)
    changed_node_ids: list[int] = Field(default_factory=list)
    pan_to_node_id: int | None = None
    highlighted_node_ids: list[int] = Field(default_factory=list)
    expanded: bool | None = None
    constellation_positions: list[dict[str, Any]] = Field(default_factory=list)
    should_refetch_focus: bool = False
    session_id: str | None = None


class ConnectorSessionCreate(BaseModel):
    actor_label: str = Field(default="External LLM", min_length=1, max_length=80)
    scopes: list[str] | None = None


class ConnectorSessionPublic(BaseModel):
    session_id: str
    connector: str
    actor_label: str
    scopes: list[str]
    created_at: datetime
    expires_at: datetime
    revoked: bool = False
    last_used_at: datetime | None = None


class ConnectorSessionCreated(ConnectorSessionPublic):
    token: str


class ConnectorToolInvokeRequest(BaseModel):
    arguments: dict[str, Any] = Field(default_factory=dict)
    idempotency_key: str | None = Field(default=None, max_length=128)
    dry_run: bool = False


class ConnectorToolInvokeResponse(BaseModel):
    tool_name: str
    call_id: str
    duration_ms: int
    dry_run: bool = False
    result: dict[str, Any] = Field(default_factory=dict)
    changed_node_ids: list[int] = Field(default_factory=list)
    should_refetch_focus: bool = False
