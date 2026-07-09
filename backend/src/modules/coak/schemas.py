# keel_api/src/modules/coak/schemas.py

"""Pydantic models for the Coak API."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

CoakItemKind = Literal["folder", "note", "flash"]


class CoakRecordPublic(BaseModel):
    id: int
    name: str
    color_hex: str
    created_at: datetime
    updated_at: datetime


class CoakRecordCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=256)
    color_hex: str | None = None


class CoakRecordUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=256)
    color_hex: str | None = None


class CoakTagPublic(BaseModel):
    id: int
    name: str
    description: str | None = None
    color_hex: str
    item_count: int = 0


class CoakTagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=512)
    color_hex: str | None = None


class CoakTagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=512)
    color_hex: str | None = None


class CoakItemPublic(BaseModel):
    id: int
    coak_record_id: int
    parent_id: int | None
    kind: CoakItemKind
    name: str
    color_hex: str
    sort_order: int
    media_id: UUID | None = None
    note_body: str
    flash_front: str
    flash_back: str
    tags: list[CoakTagPublic] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class CoakItemCreate(BaseModel):
    kind: CoakItemKind
    name: str = Field(..., min_length=1, max_length=256)
    parent_id: int | None = None
    color_hex: str | None = None
    sort_order: int | None = None
    media_id: UUID | None = None
    note_body: str | None = None
    flash_front: str | None = None
    flash_back: str | None = None
    tag_ids: list[int] = Field(default_factory=list)


class CoakItemUpdate(BaseModel):
    kind: CoakItemKind | None = None
    name: str | None = Field(default=None, min_length=1, max_length=256)
    parent_id: int | None = None
    color_hex: str | None = None
    sort_order: int | None = None
    media_id: UUID | None = None
    note_body: str | None = None
    flash_front: str | None = None
    flash_back: str | None = None
    tag_ids: list[int] | None = None


class CoakNodePosition(BaseModel):
    item_id: int
    x: float
    y: float
    z: float


class CoakCameraState(BaseModel):
    distance: float
    polar_angle: float
    azimuth_angle: float


class CoakPanelRect(BaseModel):
    x: float
    y: float
    width: float
    height: float
    z_index: int = 1


class CoakWorkspaceStatePublic(BaseModel):
    state_version: int
    node_positions: list[CoakNodePosition] = Field(default_factory=list)
    expanded_folder_ids: list[int] = Field(default_factory=list)
    pinned_item_ids: list[int] = Field(default_factory=list)
    camera: CoakCameraState | None = None
    persisted: bool = False


class CoakWorkspaceStateUpdate(BaseModel):
    state_version: int
    node_positions: list[CoakNodePosition] = Field(default_factory=list)
    expanded_folder_ids: list[int] = Field(default_factory=list)
    pinned_item_ids: list[int] = Field(default_factory=list)
    camera: CoakCameraState | None = None


class CoakWorkspaceWindow(BaseModel):
    id: str
    rect: CoakPanelRect
    tabs: list[str]
    active_tab: str


class CoakWorkspaceSettingsPublic(BaseModel):
    panels: dict[str, CoakPanelRect] = Field(default_factory=dict)
    panel_order: list[str] = Field(default_factory=list)
    windows: list[CoakWorkspaceWindow] = Field(default_factory=list)
    window_order: list[str] = Field(default_factory=list)
    persisted: bool = False


class CoakWorkspaceSettingsUpdate(BaseModel):
    panels: dict[str, CoakPanelRect] = Field(default_factory=dict)
    panel_order: list[str] = Field(default_factory=list)
    windows: list[CoakWorkspaceWindow] = Field(default_factory=list)
    window_order: list[str] = Field(default_factory=list)


class CoakConfigurationSettingsPublic(BaseModel):
    settings: dict[str, Any] = Field(default_factory=dict)
    persisted: bool = False


class CoakConfigurationSettingsUpdate(BaseModel):
    settings: dict[str, Any] = Field(default_factory=dict)
