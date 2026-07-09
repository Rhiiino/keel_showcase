# keel_api/src/modules/timeline/schemas.py

"""Pydantic models for the timeline API."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class TimelineTagPublic(BaseModel):
    id: int
    name: str
    description: str | None = None
    color_hex: str
    event_count: int = 0
    plan_item_count: int = 0


class TimelineTagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=512)
    color_hex: str | None = None


class TimelineTagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=512)
    color_hex: str | None = None


class TimelineEventContactPublic(BaseModel):
    id: int
    display_name: str


class TimelineEventFigurePublic(BaseModel):
    id: int
    display_name: str


ReminderUnit = Literal["minutes", "hours", "days"]


class TimelineEventReminderPublic(BaseModel):
    id: int
    amount: int
    unit: ReminderUnit
    sent_at: datetime | None = None


class TimelineEventReminderInput(BaseModel):
    amount: int = Field(..., gt=0)
    unit: ReminderUnit


class TimelineEventPublic(BaseModel):
    id: int
    user_id: int
    subject_name: str | None
    description: str
    start_date: datetime
    end_date: datetime | None
    all_day: bool
    contacts: list[TimelineEventContactPublic] = Field(default_factory=list)
    figures: list[TimelineEventFigurePublic] = Field(default_factory=list)
    tags: list[TimelineTagPublic] = Field(default_factory=list)
    reminders: list[TimelineEventReminderPublic] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class TimelineEventCreate(BaseModel):
    subject_name: str | None = Field(default=None, max_length=512)
    description: str = Field(..., min_length=1, max_length=8000)
    start_date: datetime
    end_date: datetime | None = None
    all_day: bool = False
    contact_ids: list[int] = Field(default_factory=list)
    figure_ids: list[int] = Field(default_factory=list)
    tag_ids: list[int] = Field(default_factory=list)
    reminders: list[TimelineEventReminderInput] = Field(default_factory=list)


class TimelineEventUpdate(BaseModel):
    subject_name: str | None = Field(default=None, max_length=512)
    description: str | None = Field(default=None, min_length=1, max_length=8000)
    start_date: datetime | None = None
    end_date: datetime | None = None
    all_day: bool | None = None
    contact_ids: list[int] | None = None
    figure_ids: list[int] | None = None
    tag_ids: list[int] | None = None
    reminders: list[TimelineEventReminderInput] | None = None


PlanItemStatus = Literal["planned", "done", "skipped"]


class TimelinePlanPublic(BaseModel):
    id: int
    user_id: int
    title: str
    start_date: date
    end_date: date
    notes: str
    item_count: int = 0
    created_at: datetime
    updated_at: datetime


class TimelinePlanCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=256)
    start_date: date
    end_date: date
    notes: str = Field(default="")


class TimelinePlanUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=256)
    start_date: date | None = None
    end_date: date | None = None
    notes: str | None = None


class TimelinePlanItemPublic(BaseModel):
    id: int
    user_id: int
    plan_id: int
    title: str
    description: str
    start_at: datetime
    end_at: datetime | None
    all_day: bool
    sort_order: int
    status: PlanItemStatus
    timeline_event_id: int | None
    tags: list[TimelineTagPublic] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class TimelinePlanDetailPublic(TimelinePlanPublic):
    items: list[TimelinePlanItemPublic] = Field(default_factory=list)


class TimelinePlanItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=256)
    description: str = Field(default="")
    start_at: datetime
    end_at: datetime | None = None
    all_day: bool = False
    sort_order: int | None = None
    status: PlanItemStatus = "planned"
    tag_ids: list[int] = Field(default_factory=list)


class TimelinePlanItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=256)
    description: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    all_day: bool | None = None
    sort_order: int | None = None
    status: PlanItemStatus | None = None
    tag_ids: list[int] | None = None


class TimelinePlanItemReorder(BaseModel):
    sort_order: int = Field(..., ge=0)


class TimelinePlanItemLinkEvent(BaseModel):
    timeline_event_id: int = Field(..., gt=0)


class TimelineCalendarPublic(BaseModel):
    events: list[TimelineEventPublic] = Field(default_factory=list)
    plan_items: list[TimelinePlanItemPublic] = Field(default_factory=list)
