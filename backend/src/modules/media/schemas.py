# keel_api/src/modules/media/schemas.py

"""Media module request and response schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class MediaPublic(BaseModel):
    """Public metadata for one stored media object."""

    id: UUID
    user_id: int
    folder_id: UUID | None
    original_filename: str
    mime_type: str
    byte_size: int
    media_kind: str
    status: str
    url: str
    attachment_count: int = 0
    created_at: datetime
    updated_at: datetime


class MediaFolderPublic(BaseModel):
    """Public metadata for one media folder."""

    id: UUID
    user_id: int
    parent_folder_id: UUID | None
    name: str
    byte_size: int = 0
    sort_order: int
    created_at: datetime
    updated_at: datetime


class MediaFolderContentsPublic(BaseModel):
    """Folders and files at one folder scope (root when folder is null)."""

    folder: MediaFolderPublic | None
    breadcrumbs: list[MediaFolderPublic]
    folders: list[MediaFolderPublic]
    media: list[MediaPublic]


class MediaUpdate(BaseModel):
    """Rename or move a media object."""

    original_filename: str | None = Field(default=None, min_length=1, max_length=500)
    folder_id: UUID | None = None


class MediaFolderCreate(BaseModel):
    """Create a folder under a parent or at the media root."""

    name: str = Field(min_length=1, max_length=200)
    parent_folder_id: UUID | None = None


class MediaFolderUpdate(BaseModel):
    """Rename or move a folder."""

    name: str | None = Field(default=None, min_length=1, max_length=200)
    parent_folder_id: UUID | None = None


class MediaAttachmentPublic(BaseModel):
    """One attachment linking media to an entity."""

    id: int
    media_id: UUID
    entity_type: str
    entity_id: int
    role: str
    sort_order: int
    display_name: str | None
    project_folder_id: UUID | None = None
    created_at: datetime
    media: MediaPublic


class MediaAttachmentCreate(BaseModel):
    """Attach media to an entity."""

    entity_type: str
    entity_id: int = Field(ge=1)
    role: str
    sort_order: int = 0
    display_name: str | None = None
    project_folder_id: UUID | None = None


class MediaAttachmentUpdate(BaseModel):
    """Update attachment metadata."""

    role: str | None = None
    sort_order: int | None = None
    display_name: str | None = None
    project_folder_id: UUID | None = None


class MediaPanelPublic(BaseModel):
    """Public metadata for one media display panel."""

    id: UUID
    user_id: int
    name: str
    column_count: int
    row_unit_px: int
    sort_order: int
    item_count: int = 0
    preview_media_id: UUID | None = None
    created_at: datetime
    updated_at: datetime


class MediaPanelItemPublic(BaseModel):
    """One media tile on a panel."""

    id: UUID
    panel_id: UUID
    media_id: UUID
    grid_x: int
    grid_y: int
    col_span: int
    row_span: int
    preview_scale: float
    preview_focal_x: float
    preview_focal_y: float
    border_color: str | None = None
    created_at: datetime
    updated_at: datetime
    media: MediaPublic


class MediaPanelDetailPublic(BaseModel):
    """Panel with all items and nested media."""

    id: UUID
    user_id: int
    name: str
    column_count: int
    row_unit_px: int
    sort_order: int
    created_at: datetime
    updated_at: datetime
    items: list[MediaPanelItemPublic]


class MediaPanelCreate(BaseModel):
    """Create a display panel."""

    name: str = Field(min_length=1, max_length=200)


class MediaPanelUpdate(BaseModel):
    """Rename a display panel."""

    name: str | None = Field(default=None, min_length=1, max_length=200)


class MediaPanelItemCreate(BaseModel):
    """Add one media tile to a panel."""

    media_id: UUID
    grid_x: int | None = None
    grid_y: int | None = None
    col_span: int | None = Field(default=None, ge=1)
    row_span: int | None = Field(default=None, ge=1)
    layout_updates: list["MediaPanelLayoutItem"] | None = None


class MediaPanelItemUpdate(BaseModel):
    """Update one tile placement."""

    grid_x: int | None = Field(default=None, ge=0)
    grid_y: int | None = Field(default=None, ge=0)
    col_span: int | None = Field(default=None, ge=1)
    row_span: int | None = Field(default=None, ge=1)
    preview_scale: float | None = Field(default=None, ge=1.0, le=8.0)
    preview_focal_x: float | None = Field(default=None, ge=0.0, le=1.0)
    preview_focal_y: float | None = Field(default=None, ge=0.0, le=1.0)
    border_color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")


class MediaPanelItemSwap(BaseModel):
    """Swap grid placements between two tiles on one panel."""

    item_a_id: UUID
    item_b_id: UUID


class MediaPanelLayoutItem(BaseModel):
    """One tile placement in a batch layout update."""

    id: UUID
    grid_x: int = Field(ge=0)
    grid_y: int = Field(ge=0)
    col_span: int = Field(ge=1)
    row_span: int = Field(ge=1)


class MediaPanelLayoutUpdate(BaseModel):
    """Batch replace tile placements for reflow saves."""

    items: list[MediaPanelLayoutItem]
