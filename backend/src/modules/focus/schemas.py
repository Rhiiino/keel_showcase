# keel_api/src/modules/focus/schemas.py

"""Pydantic models for the Focus API."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class FocusTagPublic(BaseModel):
    id: int
    name: str
    color_hex: str


class FocusTagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    color_hex: str | None = None


class FocusTagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    color_hex: str | None = None


class FocusReferenceTargetSummary(BaseModel):
    target_type: str
    target_id: str
    title: str
    subtitle: str | None = None
    is_missing: bool = False
    web_path: str | None = None
    mime_type: str | None = None
    media_kind: str | None = None
    content_updated_at: datetime | None = None


class FocusReferenceTypePublic(BaseModel):
    target_type: str
    display_name: str
    user_scoped: bool
    enabled: bool = True


class FocusReferenceSearchResult(BaseModel):
    target_type: str
    target_id: str
    title: str
    subtitle: str | None = None


class FocusReferencePropertyPublic(BaseModel):
    key: str
    label: str
    value: str


class FocusReferenceDetailPublic(BaseModel):
    target_type: str
    target_id: str
    title: str
    is_missing: bool = False
    properties: list[FocusReferencePropertyPublic] = Field(default_factory=list)


class FocusReferenceSettingsPublic(BaseModel):
    reference_enabled_types: list[str]


class FocusReferenceSettingsUpdate(BaseModel):
    reference_enabled_types: list[str] = Field(..., min_length=1)


class FocusConstellationNodePosition(BaseModel):
    key: str = Field(..., min_length=1, max_length=128)
    x: float
    y: float


class FocusConstellationWorkOrderBadgeAngle(BaseModel):
    key: str = Field(..., min_length=1, max_length=128)
    angle: float


class FocusConstellationViewport(BaseModel):
    x: float
    y: float
    zoom: float = Field(..., gt=0)


class FocusConstellationStatePublic(BaseModel):
    state_version: int = 6
    node_positions: list[FocusConstellationNodePosition] = Field(default_factory=list)
    work_order_badge_angles: list[FocusConstellationWorkOrderBadgeAngle] = Field(
        default_factory=list,
    )
    expanded_ids: list[str] = Field(default_factory=list)
    standalone_list_ids: list[int] = Field(default_factory=list)
    viewport: FocusConstellationViewport | None = None


class FocusConstellationStateUpdate(BaseModel):
    state_version: int = 6
    node_positions: list[FocusConstellationNodePosition] = Field(default_factory=list)
    work_order_badge_angles: list[FocusConstellationWorkOrderBadgeAngle] = Field(
        default_factory=list,
    )
    expanded_ids: list[str] = Field(default_factory=list)
    standalone_list_ids: list[int] = Field(default_factory=list)
    viewport: FocusConstellationViewport | None = None


class FocusConstellationConfigPanelPosition(BaseModel):
    x: float
    y: float


class FocusConstellationSettingsPublic(BaseModel):
    node_shape: str = "circle"
    canvas_tone: str = "slate"
    connection_color: str = "silver"
    connection_style: str = "flexible"
    list_node_style: str = "glass"
    label_font_key: str = "default"
    node_size_multiplier: float = 1.0
    title_size_px: int = 11
    unlink_distance_multiplier: float = 2.0
    config_open: bool = True
    config_position: FocusConstellationConfigPanelPosition = Field(
        default_factory=lambda: FocusConstellationConfigPanelPosition(x=24, y=32),
    )
    notes_panel_position: FocusConstellationConfigPanelPosition = Field(
        default_factory=lambda: FocusConstellationConfigPanelPosition(x=20, y=680),
    )
    node_info_enabled: bool = True
    persisted: bool = False


class FocusConstellationSettingsUpdate(BaseModel):
    node_shape: str
    canvas_tone: str
    connection_color: str
    connection_style: str
    list_node_style: str
    label_font_key: str
    node_size_multiplier: float
    title_size_px: int
    unlink_distance_multiplier: float
    config_open: bool
    config_position: FocusConstellationConfigPanelPosition
    notes_panel_position: FocusConstellationConfigPanelPosition
    node_info_enabled: bool


class FocusNodePublic(BaseModel):
    id: int
    user_id: int
    parent_id: int | None = None
    kind: str
    sort_order: int
    title: str

    notes: str | None = None
    status: str | None = None
    completed_at: datetime | None = None
    work_order: int | None = None

    node_color_hex: str | None = None
    title_font_key: str | None = None
    is_origin: bool = False

    reference_target: FocusReferenceTargetSummary | None = None
    show_reference_content: bool = False
    child_count: int = 0
    tags: list[FocusTagPublic] = Field(default_factory=list)
    children: list[FocusNodePublic] = Field(default_factory=list)

    created_at: datetime
    updated_at: datetime


class FocusNodeCreate(BaseModel):
    kind: str = Field(..., max_length=32)
    title: str = Field(..., min_length=1, max_length=512)
    parent_id: int | None = Field(default=None, ge=1)
    sort_order: int | None = None

    notes: str = Field(default="", max_length=8000)
    status: str | None = Field(default=None, max_length=32)
    work_order: int | None = Field(default=None, ge=0)

    node_color_hex: str | None = None
    title_font_key: str | None = None
    is_origin: bool | None = None
    tag_ids: list[int] | None = None

    reference_target_type: str | None = Field(default=None, max_length=64)
    reference_target_id: str | None = Field(default=None, min_length=1, max_length=128)
    show_reference_content: bool | None = None


class FocusNodeUpdate(BaseModel):
    kind: str | None = Field(default=None, max_length=32)
    title: str | None = Field(default=None, min_length=1, max_length=512)
    parent_id: int | None = Field(default=None)
    sort_order: int | None = None

    notes: str | None = Field(default=None, max_length=8000)
    status: str | None = Field(default=None, max_length=32)
    work_order: int | None = Field(default=None, ge=0)

    node_color_hex: str | None = None
    title_font_key: str | None = None
    is_origin: bool | None = None
    tag_ids: list[int] | None = None

    reference_target_type: str | None = Field(default=None, max_length=64)
    reference_target_id: str | None = Field(default=None, min_length=1, max_length=128)
    show_reference_content: bool | None = None


class FocusNodeReorderEntry(BaseModel):
    id: int = Field(..., ge=1)
    sort_order: int = Field(..., ge=0)


class FocusNodeReorder(BaseModel):
    entries: list[FocusNodeReorderEntry] = Field(..., min_length=1)


class FocusNodeTimeEntryPublic(BaseModel):
    id: int
    user_id: int
    node_id: int
    status: str
    started_at: datetime
    last_paused_at: datetime | None = None
    ended_at: datetime | None = None
    accumulated_paused_seconds: int = 0
    duration_seconds: int | None = None
    created_at: datetime
    updated_at: datetime


class FocusNodeTimerStatePublic(BaseModel):
    node_id: int
    active_entry: FocusNodeTimeEntryPublic | None = None
    elapsed_seconds: int = 0


# Legacy shapes for LLM tool executors (list/entry vocabulary).
class FocusListCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=512)
    notes: str = Field(default="", max_length=8000)
    status: str = Field(default="active", max_length=32)
    sort_order: int | None = None
    node_color_hex: str | None = None
    title_font_key: str | None = None
    is_origin: bool | None = None
    tag_ids: list[int] | None = None


class FocusListUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=512)
    notes: str | None = Field(default=None, max_length=8000)
    status: str | None = Field(default=None, max_length=32)
    sort_order: int | None = None
    node_color_hex: str | None = None
    title_font_key: str | None = None
    is_origin: bool | None = None
    tag_ids: list[int] | None = None


class FocusLinkedListCreateInline(BaseModel):
    notes: str = Field(default="", max_length=8000)
    node_color_hex: str | None = None
    title_font_key: str | None = None
    tag_ids: list[int] | None = None


class FocusEntryCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=512)
    list_id: int = Field(..., ge=1)
    kind: str = Field(default="task", max_length=32)
    notes: str = Field(default="", max_length=8000)
    status: str = Field(default="active", max_length=32)
    sort_order: int | None = None
    linked_list_id: int | None = Field(default=None, ge=1)
    linked_list: FocusLinkedListCreateInline | None = None


class FocusEntryUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=512)
    notes: str | None = Field(default=None, max_length=8000)
    list_id: int | None = Field(default=None)
    status: str | None = Field(default=None, max_length=32)
    sort_order: int | None = None
