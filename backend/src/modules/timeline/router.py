# keel_api/src/modules/timeline/router.py

"""HTTP routes for timeline events (session required)."""

from __future__ import annotations

from datetime import date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.timeline import config, plans_service, service
from modules.timeline.schemas import (
    TimelineCalendarPublic,
    TimelineEventCreate,
    TimelineEventPublic,
    TimelineEventUpdate,
    TimelinePlanCreate,
    TimelinePlanDetailPublic,
    TimelinePlanItemCreate,
    TimelinePlanItemLinkEvent,
    TimelinePlanItemPublic,
    TimelinePlanItemReorder,
    TimelinePlanItemUpdate,
    TimelinePlanPublic,
    TimelinePlanUpdate,
    TimelineTagCreate,
    TimelineTagPublic,
    TimelineTagUpdate,
)

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]



# ----- Timeline tags
@router.get(config.TAG_LIST_PATH, response_model=list[TimelineTagPublic])
async def list_timeline_tags(user: CurrentUser) -> list[TimelineTagPublic]:
    """List the current user's timeline tags."""
    return await service.list_timeline_tags(user.id)


@router.post(
    config.TAG_LIST_PATH,
    response_model=TimelineTagPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_timeline_tag(
    payload: TimelineTagCreate,
    user: CurrentUser,
) -> TimelineTagPublic:
    """Create a timeline tag for the current user."""
    return await service.create_timeline_tag(user.id, payload)


@router.patch(config.TAG_BY_ID_PATH, response_model=TimelineTagPublic)
async def update_timeline_tag(
    tag_id: int,
    payload: TimelineTagUpdate,
    user: CurrentUser,
) -> TimelineTagPublic:
    """Update one timeline tag."""
    return await service.update_timeline_tag(user.id, tag_id, payload)


@router.delete(config.TAG_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_timeline_tag(tag_id: int, user: CurrentUser) -> None:
    """Delete one timeline tag."""
    await service.delete_timeline_tag(user.id, tag_id)



# ----- Timeline events
@router.get(config.EVENTS_PATH, response_model=list[TimelineEventPublic])
async def list_events(
    user: CurrentUser,
    contact_id: int | None = Query(default=None),
    contact_ids: list[int] | None = Query(default=None),
    figure_id: int | None = Query(default=None),
    figure_ids: list[int] | None = Query(default=None),
    query: str | None = Query(default=None),
    subject_name: str | None = Query(default=None),
    start_date_from: date | None = Query(default=None),
    start_date_to: date | None = Query(default=None),
    tag_ids: list[int] | None = Query(default=None),
) -> list[TimelineEventPublic]:
    """List the current user's timeline events."""
    return await service.list_events(
        user.id,
        contact_id=contact_id,
        contact_ids=contact_ids,
        figure_id=figure_id,
        figure_ids=figure_ids,
        query=query,
        subject_name=subject_name,
        start_date_from=start_date_from,
        start_date_to=start_date_to,
        tag_ids=tag_ids,
    )


@router.post(
    config.EVENTS_PATH,
    response_model=TimelineEventPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_event(
    payload: TimelineEventCreate,
    user: CurrentUser,
) -> TimelineEventPublic:
    """Create a timeline event for the current user."""
    return await service.create_event(user.id, payload)


@router.get(config.EVENT_BY_ID_PATH, response_model=TimelineEventPublic)
async def get_event(event_id: int, user: CurrentUser) -> TimelineEventPublic:
    """Return one timeline event."""
    return await service.get_event(user.id, event_id)


@router.patch(config.EVENT_BY_ID_PATH, response_model=TimelineEventPublic)
async def update_event(
    event_id: int,
    payload: TimelineEventUpdate,
    user: CurrentUser,
) -> TimelineEventPublic:
    """Update one timeline event."""
    return await service.update_event(user.id, event_id, payload)


@router.delete(config.EVENT_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(event_id: int, user: CurrentUser) -> None:
    """Delete one timeline event."""
    await service.delete_event(user.id, event_id)



# ----- Timeline calendar feed
@router.get(config.CALENDAR_PATH, response_model=TimelineCalendarPublic)
async def get_calendar_feed(
    user: CurrentUser,
    start: datetime = Query(...),
    end: datetime = Query(...),
) -> TimelineCalendarPublic:
    """Return timeline events and plan items overlapping a datetime range."""
    events = await service.list_events(
        user.id,
        start_date_from=start.date(),
        start_date_to=end.date(),
    )
    plan_items = await plans_service.list_plan_items_in_range(
        user.id,
        start_at_from=start,
        start_at_to=end,
    )
    return TimelineCalendarPublic(events=events, plan_items=plan_items)



# ----- Timeline plans
@router.get(config.PLANS_PATH, response_model=list[TimelinePlanPublic])
async def list_plans(
    user: CurrentUser,
    start_date_from: date | None = Query(default=None),
    start_date_to: date | None = Query(default=None),
) -> list[TimelinePlanPublic]:
    """List the current user's timeline plans."""
    return await plans_service.list_plans(
        user.id,
        start_date_from=start_date_from,
        start_date_to=start_date_to,
    )


@router.post(
    config.PLANS_PATH,
    response_model=TimelinePlanPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_plan(payload: TimelinePlanCreate, user: CurrentUser) -> TimelinePlanPublic:
    """Create a timeline plan."""
    return await plans_service.create_plan(user.id, payload)


@router.get(config.PLAN_BY_ID_PATH, response_model=TimelinePlanDetailPublic)
async def get_plan(plan_id: int, user: CurrentUser) -> TimelinePlanDetailPublic:
    """Return one timeline plan with its items."""
    return await plans_service.get_plan_detail(user.id, plan_id)


@router.patch(config.PLAN_BY_ID_PATH, response_model=TimelinePlanPublic)
async def update_plan(
    plan_id: int,
    payload: TimelinePlanUpdate,
    user: CurrentUser,
) -> TimelinePlanPublic:
    """Update one timeline plan."""
    return await plans_service.update_plan(user.id, plan_id, payload)


@router.delete(config.PLAN_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(plan_id: int, user: CurrentUser) -> None:
    """Delete one timeline plan and its items."""
    await plans_service.delete_plan(user.id, plan_id)



# ----- Timeline plan items
@router.post(
    config.PLAN_ITEMS_PATH,
    response_model=TimelinePlanItemPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_plan_item(
    plan_id: int,
    payload: TimelinePlanItemCreate,
    user: CurrentUser,
) -> TimelinePlanItemPublic:
    """Create a plan item under a timeline plan."""
    return await plans_service.create_plan_item(user.id, plan_id, payload)


@router.patch(config.PLAN_ITEM_BY_ID_PATH, response_model=TimelinePlanItemPublic)
async def update_plan_item(
    plan_item_id: int,
    payload: TimelinePlanItemUpdate,
    user: CurrentUser,
) -> TimelinePlanItemPublic:
    """Update one timeline plan item."""
    return await plans_service.update_plan_item(user.id, plan_item_id, payload)


@router.delete(config.PLAN_ITEM_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan_item(plan_item_id: int, user: CurrentUser) -> None:
    """Delete one timeline plan item."""
    await plans_service.delete_plan_item(user.id, plan_item_id)


@router.post(config.PLAN_ITEM_REORDER_PATH, response_model=TimelinePlanItemPublic)
async def reorder_plan_item(
    plan_item_id: int,
    payload: TimelinePlanItemReorder,
    user: CurrentUser,
) -> TimelinePlanItemPublic:
    """Update sort order for one plan item."""
    return await plans_service.reorder_plan_item(user.id, plan_item_id, payload)


@router.post(config.PLAN_ITEM_PROMOTE_PATH, response_model=TimelinePlanItemPublic)
async def promote_plan_item(
    plan_item_id: int,
    user: CurrentUser,
) -> TimelinePlanItemPublic:
    """Promote a plan item to a timeline event."""
    return await plans_service.promote_plan_item(user.id, plan_item_id)


@router.post(config.PLAN_ITEM_LINK_EVENT_PATH, response_model=TimelinePlanItemPublic)
async def link_plan_item_event(
    plan_item_id: int,
    payload: TimelinePlanItemLinkEvent,
    user: CurrentUser,
) -> TimelinePlanItemPublic:
    """Link a plan item to an existing timeline event."""
    return await plans_service.link_plan_item_event(user.id, plan_item_id, payload)
