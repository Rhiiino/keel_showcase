# keel_api/src/modules/settings/schemas.py
"""Pydantic models for per-user cross-frontend UI settings.

Nav layout entries mirror the web client shape:
  { "kind": "item" | "separator", "id": "<registry id or sep-*>" }
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator


class NavLayoutItemEntry(BaseModel):
    kind: Literal["item"]
    id: str = Field(min_length=1, max_length=100)


class NavLayoutSeparatorEntry(BaseModel):
    kind: Literal["separator"]
    id: str = Field(min_length=1, max_length=100)


NavLayoutEntry = Annotated[
    Union[NavLayoutItemEntry, NavLayoutSeparatorEntry],
    Field(discriminator="kind"),
]


class NavPanelPrefs(BaseModel):
    open: bool | None = None
    width: int | None = Field(default=None, ge=120, le=480)


class TransitionPresetConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    preset: str = Field(min_length=1, max_length=50)
    duration_ms: int = Field(ge=0, le=800, alias="durationMs")


class TransitionSettings(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    enabled: bool | None = None
    menu: TransitionPresetConfig | None = None
    page: TransitionPresetConfig | None = None


class ShellBackgroundSettings(BaseModel):
    enabled: bool | None = None
    media_id: str | None = Field(default=None, max_length=36)
    media_updated_at: str | None = Field(default=None, max_length=50)


class HomeSlideshowSettings(BaseModel):
    media_ids: list[str] | None = None
    interval_seconds: int | None = Field(default=None, ge=2, le=60)
    paused: bool | None = None
    paused_media_id: str | None = None


class HomeCardLayoutEntry(BaseModel):
    id: str = Field(min_length=1, max_length=50)
    x: float = Field(default=0, ge=0, le=10_000)
    y: float = Field(default=0, ge=0, le=10_000)
    width: float | None = Field(default=None, ge=160, le=1_200)
    height: float | None = Field(default=None, ge=160, le=800)


class EmailLastFetchFilters(BaseModel):
    model_config = ConfigDict(extra="ignore")

    mailbox: str | None = None
    from_or_to: str | None = Field(default=None, max_length=500)
    subject: str | None = Field(default=None, max_length=500)
    body: str | None = Field(default=None, max_length=500)
    max_results: int | None = Field(default=None, ge=1, le=500)


class EmailSettings(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    last_fetch_filters: dict[str, EmailLastFetchFilters] | None = Field(
        default=None,
        alias="lastFetchFilters",
    )


class UserSettingsPatch(BaseModel):
    """Partial update — only provided top-level keys are merged into stored data."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    nav_menu_layout: list[NavLayoutEntry] | None = None
    nav_menu_visibility: dict[str, bool] | None = None
    nav_wave_glow_enabled: bool | None = None
    nav_breadcrumb_max_entries: int | None = Field(default=None, ge=1, le=10)
    timezone: str | None = Field(default=None, min_length=1, max_length=100)
    nav_panel: NavPanelPrefs | None = None
    theme: str | None = Field(default=None, min_length=1, max_length=50)
    transitions: TransitionSettings | None = None
    home_greeting_font_key: str | None = Field(default=None, max_length=50)
    home_greeting_font_size_px: int | None = Field(default=None, ge=20, le=72)
    home_quote_interval_seconds: int | None = Field(default=None, ge=2, le=60)
    shell_background: ShellBackgroundSettings | None = None
    home_slideshow: HomeSlideshowSettings | None = None
    home_card_layout: list[HomeCardLayoutEntry] | None = None
    home_card_visibility: dict[str, bool] | None = None
    email: EmailSettings | None = None

    @field_validator("nav_menu_layout")
    @classmethod
    def validate_nav_layout_unique(
        cls,
        layout: list[NavLayoutEntry] | None,
    ) -> list[NavLayoutEntry] | None:
        if layout is None:
            return layout

        seen: set[str] = set()
        for entry in layout:
            key = f"{entry.kind}:{entry.id}"
            if key in seen:
                raise ValueError(
                    f"Duplicate nav layout entry: kind={entry.kind!r} id={entry.id!r}",
                )
            seen.add(key)
        return layout


class UserSettingsPublic(BaseModel):
    data: dict[str, Any] = Field(default_factory=dict)
    updated_at: datetime
