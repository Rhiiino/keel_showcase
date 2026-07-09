# keel_api/src/modules/focus/router.py

"""HTTP routes for Focus nodes, tags, and references."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import Response

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.focus import config, service
from modules.focus.schemas import (
    FocusNodeCreate,
    FocusNodePublic,
    FocusNodeReorder,
    FocusNodeTimeEntryPublic,
    FocusNodeTimerStatePublic,
    FocusNodeUpdate,
    FocusReferenceSearchResult,
    FocusReferenceDetailPublic,
    FocusConstellationSettingsPublic,
    FocusConstellationSettingsUpdate,
    FocusConstellationStatePublic,
    FocusConstellationStateUpdate,
    FocusReferenceSettingsPublic,
    FocusReferenceSettingsUpdate,
    FocusReferenceTypePublic,
    FocusTagCreate,
    FocusTagPublic,
    FocusTagUpdate,
)

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]



# ----- Focus nodes
@router.get(config.NODE_LIST_PATH, response_model=list[FocusNodePublic])
async def list_focus_nodes(
    user: CurrentUser,
    parent_id: int | None = Query(default=None),
    roots_only: bool = Query(default=False),
    kind: str | None = Query(default=None),
    kinds: list[str] | None = Query(default=None),
    status: str | None = Query(default=None),
    hub_lists_only: bool = Query(default=False),
) -> list[FocusNodePublic]:
    """List focus nodes with optional filters."""
    return await service.list_focus_nodes(
        user.id,
        parent_id=parent_id,
        roots_only=roots_only,
        kind=kind,
        kinds=kinds,
        status=status,
        hub_lists_only=hub_lists_only,
    )


@router.post(
    config.NODE_LIST_PATH,
    response_model=FocusNodePublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_focus_node(
    payload: FocusNodeCreate,
    user: CurrentUser,
) -> FocusNodePublic:
    """Create an item, list, or record node."""
    return await service.create_focus_node(user.id, payload)


@router.get(config.NODE_BY_ID_PATH, response_model=FocusNodePublic)
async def get_focus_node(
    node_id: int,
    user: CurrentUser,
    include_subtree: bool = Query(default=False),
) -> FocusNodePublic:
    """Fetch one focus node, optionally with its full subtree."""
    return await service.get_focus_node(
        user.id,
        node_id,
        include_subtree=include_subtree,
    )


@router.patch(config.NODE_BY_ID_PATH, response_model=FocusNodePublic)
async def update_focus_node(
    node_id: int,
    payload: FocusNodeUpdate,
    user: CurrentUser,
) -> FocusNodePublic:
    """Update or reparent one focus node."""
    return await service.update_focus_node(user.id, node_id, payload)


@router.delete(config.NODE_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_focus_node(node_id: int, user: CurrentUser) -> Response:
    """Delete one focus node and its descendants."""
    await service.delete_focus_node(user.id, node_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(config.NODE_COMPLETE_PATH, response_model=FocusNodePublic)
async def complete_focus_node(node_id: int, user: CurrentUser) -> FocusNodePublic:
    """Mark one item node as completed."""
    return await service.complete_focus_node(user.id, node_id)


@router.post(config.NODE_REORDER_PATH, response_model=list[FocusNodePublic])
async def reorder_focus_nodes(
    payload: FocusNodeReorder,
    user: CurrentUser,
) -> list[FocusNodePublic]:
    """Update sort order for sibling nodes."""
    return await service.reorder_focus_nodes(user.id, payload)


@router.get(
    config.NODE_TIME_ENTRIES_PATH,
    response_model=list[FocusNodeTimeEntryPublic],
)
async def list_focus_node_time_entries(
    node_id: int,
    user: CurrentUser,
) -> list[FocusNodeTimeEntryPublic]:
    """List timer session history for one focus node."""
    return await service.list_focus_node_time_entries(user.id, node_id)


@router.get(config.NODE_TIMER_PATH, response_model=FocusNodeTimerStatePublic)
async def get_focus_node_timer_state(
    node_id: int,
    user: CurrentUser,
) -> FocusNodeTimerStatePublic:
    """Return the current open timer state for one focus node."""
    return await service.get_focus_node_timer_state(user.id, node_id)


@router.post(
    config.NODE_TIMER_START_PATH,
    response_model=FocusNodeTimerStatePublic,
    status_code=status.HTTP_201_CREATED,
)
async def start_focus_node_timer(
    node_id: int,
    user: CurrentUser,
) -> FocusNodeTimerStatePublic:
    """Start a new timer session for one focus node."""
    return await service.start_focus_node_timer(user.id, node_id)


@router.post(config.NODE_TIMER_PAUSE_PATH, response_model=FocusNodeTimerStatePublic)
async def pause_focus_node_timer(
    node_id: int,
    user: CurrentUser,
) -> FocusNodeTimerStatePublic:
    """Pause the running timer session for one focus node."""
    return await service.pause_focus_node_timer(user.id, node_id)


@router.post(config.NODE_TIMER_RESUME_PATH, response_model=FocusNodeTimerStatePublic)
async def resume_focus_node_timer(
    node_id: int,
    user: CurrentUser,
) -> FocusNodeTimerStatePublic:
    """Resume the paused timer session for one focus node."""
    return await service.resume_focus_node_timer(user.id, node_id)


@router.post(config.NODE_TIMER_END_PATH, response_model=FocusNodeTimerStatePublic)
async def end_focus_node_timer(
    node_id: int,
    user: CurrentUser,
) -> FocusNodeTimerStatePublic:
    """End the open timer session for one focus node."""
    return await service.end_focus_node_timer(user.id, node_id)



# ----- Reference types and picker
@router.get(config.REFERENCE_TYPES_PATH, response_model=list[FocusReferenceTypePublic])
async def list_reference_types(user: CurrentUser) -> list[FocusReferenceTypePublic]:
    """List registered reference types and whether each is enabled for the user."""
    return await service.list_reference_types(user.id)


@router.get(config.REFERENCE_SEARCH_PATH, response_model=list[FocusReferenceSearchResult])
async def search_references(
    user: CurrentUser,
    type: str = Query(..., alias="type"),
    q: str = Query(default=""),
) -> list[FocusReferenceSearchResult]:
    """Search external records for the reference picker."""
    return await service.search_references(user.id, target_type=type, query=q)


@router.get(config.REFERENCE_DETAIL_PATH, response_model=FocusReferenceDetailPublic)
async def get_reference_detail(
    user: CurrentUser,
    type: str = Query(..., alias="type"),
    id: str = Query(..., alias="id", min_length=1),
) -> FocusReferenceDetailPublic:
    """Return curated properties for one linked reference record."""
    return await service.get_reference_detail(user.id, target_type=type, target_id=id)


@router.get(config.REFERENCE_SETTINGS_PATH, response_model=FocusReferenceSettingsPublic)
async def get_reference_settings(user: CurrentUser) -> FocusReferenceSettingsPublic:
    """Return the user's enabled reference types for Focus."""
    return await service.get_reference_settings(user.id)


@router.patch(config.REFERENCE_SETTINGS_PATH, response_model=FocusReferenceSettingsPublic)
async def update_reference_settings(
    payload: FocusReferenceSettingsUpdate,
    user: CurrentUser,
) -> FocusReferenceSettingsPublic:
    """Update which reference types appear in the Focus picker."""
    return await service.update_reference_settings(user.id, payload)


@router.get(config.CONSTELLATION_STATE_PATH, response_model=FocusConstellationStatePublic)
async def get_constellation_state(user: CurrentUser) -> FocusConstellationStatePublic:
    """Return the user's persisted focus constellation layout state."""
    return await service.get_constellation_state(user.id)


@router.patch(config.CONSTELLATION_STATE_PATH, response_model=FocusConstellationStatePublic)
async def update_constellation_state(
    payload: FocusConstellationStateUpdate,
    user: CurrentUser,
) -> FocusConstellationStatePublic:
    """Persist focus constellation node positions, expansion, and viewport."""
    return await service.update_constellation_state(user.id, payload)


@router.get(
    config.CONSTELLATION_SETTINGS_PATH,
    response_model=FocusConstellationSettingsPublic,
)
async def get_constellation_settings(user: CurrentUser) -> FocusConstellationSettingsPublic:
    """Return the user's persisted focus constellation visual settings."""
    return await service.get_constellation_settings(user.id)


@router.patch(
    config.CONSTELLATION_SETTINGS_PATH,
    response_model=FocusConstellationSettingsPublic,
)
async def update_constellation_settings(
    payload: FocusConstellationSettingsUpdate,
    user: CurrentUser,
) -> FocusConstellationSettingsPublic:
    """Persist focus constellation visual settings."""
    return await service.update_constellation_settings(user.id, payload)



# ----- Focus tags
@router.get(config.TAG_LIST_PATH, response_model=list[FocusTagPublic])
async def list_focus_tags(user: CurrentUser) -> list[FocusTagPublic]:
    """List the current user's focus tags."""
    return await service.list_focus_tags(user.id)


@router.post(
    config.TAG_LIST_PATH,
    response_model=FocusTagPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_focus_tag(
    payload: FocusTagCreate,
    user: CurrentUser,
) -> FocusTagPublic:
    """Create a focus tag for the current user."""
    return await service.create_focus_tag(user.id, payload)


@router.patch(config.TAG_BY_ID_PATH, response_model=FocusTagPublic)
async def update_focus_tag(
    tag_id: int,
    payload: FocusTagUpdate,
    user: CurrentUser,
) -> FocusTagPublic:
    """Update one focus tag."""
    return await service.update_focus_tag(user.id, tag_id, payload)


@router.delete(config.TAG_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_focus_tag(tag_id: int, user: CurrentUser) -> Response:
    """Delete one focus tag."""
    await service.delete_focus_tag(user.id, tag_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
