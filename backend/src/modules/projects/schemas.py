# keel_api/src/modules/projects/schemas.py

"""Pydantic models for the projects API."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from modules.media.schemas import MediaAttachmentPublic, MediaPublic


class ProjectTagPublic(BaseModel):
    id: int
    name: str
    description: str | None = None
    color_hex: str
    project_count: int = 0


class ProjectTagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=512)
    color_hex: str | None = None


class ProjectTagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=512)
    color_hex: str | None = None


class ProjectPublic(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    status: str
    kind: str | None
    cover: MediaPublic | None = None
    gallery: list[MediaAttachmentPublic] = Field(default_factory=list)
    cover_glow_color_hex: str | None
    cover_model_color_hex: str | None
    cover_model_brightness: float = 1.0
    cover_image_scale: float = 1.0
    cover_image_position_x: float = 50.0
    cover_image_position_y: float = 50.0
    kanban_card_color_hex: str | None
    title_font_key: str | None
    tags: list[ProjectTagPublic] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=512)
    description: str = Field(default="", max_length=8000)
    status: str = Field(default="planning", max_length=32)
    kind: str | None = Field(default=None, max_length=64)


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=512)
    description: str | None = Field(default=None, max_length=8000)
    status: str | None = Field(default=None, max_length=32)
    kind: str | None = Field(default=None, max_length=64)
    tag_ids: list[int] | None = None
    cover_glow_color_hex: str | None = None
    cover_model_color_hex: str | None = None
    cover_model_brightness: float | None = None
    cover_image_scale: float | None = None
    cover_image_position_x: float | None = None
    cover_image_position_y: float | None = None
    kanban_card_color_hex: str | None = None
    title_font_key: str | None = None


class ProjectWorkspacePublic(BaseModel):
    project_id: int
    canvas_id: int
    state: dict
    settings: "ProjectWorkspaceSettingsPublic"
    updated_at: datetime | None = None


class ProjectWorkspaceConfigPanelPosition(BaseModel):
    x: float
    y: float


class ProjectWorkspaceNotesGridPlacement(BaseModel):
    id: str
    grid_x: int
    grid_y: int
    col_span: int
    row_span: int


class ProjectWorkspaceSettingsPublic(BaseModel):
    canvas_color: str = "default"
    snap_enabled: bool = False
    minimap_open: bool = True
    grid_dot_strength: float = 1.0
    config_open: bool = True
    config_position: ProjectWorkspaceConfigPanelPosition = Field(
        default_factory=lambda: ProjectWorkspaceConfigPanelPosition(x=24, y=32),
    )
    text_font_scale: float = 1.0
    connection_style: str = "smooth"
    note_color_style: str = "filled"
    note_italic_color: str = "slate"
    notes_grid_layout: list[ProjectWorkspaceNotesGridPlacement] | None = None
    persisted: bool = False


class ProjectWorkspaceSettingsUpdate(BaseModel):
    canvas_color: str
    snap_enabled: bool
    minimap_open: bool = True
    grid_dot_strength: float = 1.0
    config_open: bool
    config_position: ProjectWorkspaceConfigPanelPosition
    text_font_scale: float
    connection_style: str
    note_color_style: str = "filled"
    note_italic_color: str = "slate"
    notes_grid_layout: list[ProjectWorkspaceNotesGridPlacement] | None = None


class ProjectWorkspaceUpdate(BaseModel):
    state: dict


class ProjectCanvasPublic(BaseModel):
    canvas_id: int
    project_id: int
    name: str
    sort_order: int
    is_default: bool
    updated_at: datetime


class ProjectCanvasCreate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)


class ProjectCanvasUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    sort_order: int | None = None
    is_default: bool | None = None


class ProjectFolderPublic(BaseModel):
    id: UUID
    project_id: int
    user_id: int
    parent_folder_id: UUID | None
    name: str
    sort_order: int
    created_at: datetime
    updated_at: datetime


class ProjectFolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    parent_folder_id: UUID | None = None


class ProjectFolderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    parent_folder_id: UUID | None = None
    sort_order: int | None = None
