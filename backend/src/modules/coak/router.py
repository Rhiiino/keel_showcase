# keel_api/src/modules/coak/router.py

"""HTTP routes for Coak learning workspaces."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.coak import config
from modules.coak.schemas import (
    CoakConfigurationSettingsPublic,
    CoakConfigurationSettingsUpdate,
    CoakItemCreate,
    CoakItemPublic,
    CoakItemUpdate,
    CoakRecordCreate,
    CoakRecordPublic,
    CoakRecordUpdate,
    CoakTagCreate,
    CoakTagPublic,
    CoakTagUpdate,
    CoakWorkspaceSettingsPublic,
    CoakWorkspaceSettingsUpdate,
    CoakWorkspaceStatePublic,
    CoakWorkspaceStateUpdate,
)
from modules.coak.service import (
    configuration_settings,
    items,
    records,
    tags,
    workspace_settings,
    workspace_state,
)

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]



# ----- Coak records
@router.get(config.RECORDS_PATH, response_model=list[CoakRecordPublic])
async def list_coak_records(user: CurrentUser) -> list[CoakRecordPublic]:
    """List the current user's Coak records."""
    return await records.list_records(user.id)


@router.post(
    config.RECORDS_PATH,
    response_model=CoakRecordPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_coak_record(
    payload: CoakRecordCreate,
    user: CurrentUser,
) -> CoakRecordPublic:
    """Create a Coak record."""
    return await records.create_record(user.id, payload)


@router.get(config.RECORD_BY_ID_PATH, response_model=CoakRecordPublic)
async def get_coak_record(record_id: int, user: CurrentUser) -> CoakRecordPublic:
    """Return one Coak record."""
    return await records.get_record(user.id, record_id)


@router.patch(config.RECORD_BY_ID_PATH, response_model=CoakRecordPublic)
async def update_coak_record(
    record_id: int,
    payload: CoakRecordUpdate,
    user: CurrentUser,
) -> CoakRecordPublic:
    """Update one Coak record."""
    return await records.update_record(user.id, record_id, payload)


@router.delete(config.RECORD_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_coak_record(record_id: int, user: CurrentUser) -> None:
    """Delete one Coak record and its items."""
    await records.delete_record(user.id, record_id)



# ----- Coak tags
@router.get(config.RECORD_TAGS_PATH, response_model=list[CoakTagPublic])
async def list_coak_tags(record_id: int, user: CurrentUser) -> list[CoakTagPublic]:
    """List tags for one Coak record."""
    return await tags.list_tags(user.id, record_id)


@router.post(
    config.RECORD_TAGS_PATH,
    response_model=CoakTagPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_coak_tag(
    record_id: int,
    payload: CoakTagCreate,
    user: CurrentUser,
) -> CoakTagPublic:
    """Create a tag in one Coak record."""
    return await tags.create_tag(user.id, record_id, payload)


@router.patch(config.RECORD_TAG_BY_ID_PATH, response_model=CoakTagPublic)
async def update_coak_tag(
    record_id: int,
    tag_id: int,
    payload: CoakTagUpdate,
    user: CurrentUser,
) -> CoakTagPublic:
    """Update one Coak record tag."""
    return await tags.update_tag(user.id, record_id, tag_id, payload)


@router.delete(config.RECORD_TAG_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_coak_tag(record_id: int, tag_id: int, user: CurrentUser) -> None:
    """Delete one Coak record tag."""
    await tags.delete_tag(user.id, record_id, tag_id)



# ----- Coak items
@router.get(config.RECORD_ITEMS_PATH, response_model=list[CoakItemPublic])
async def list_coak_items(record_id: int, user: CurrentUser) -> list[CoakItemPublic]:
    """List directory items for one Coak record."""
    return await items.list_items(user.id, record_id)


@router.post(
    config.RECORD_ITEMS_PATH,
    response_model=CoakItemPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_coak_item(
    record_id: int,
    payload: CoakItemCreate,
    user: CurrentUser,
) -> CoakItemPublic:
    """Create a directory item in one Coak record."""
    return await items.create_item(user.id, record_id, payload)


@router.patch(config.RECORD_ITEM_BY_ID_PATH, response_model=CoakItemPublic)
async def update_coak_item(
    record_id: int,
    item_id: int,
    payload: CoakItemUpdate,
    user: CurrentUser,
) -> CoakItemPublic:
    """Update one directory item."""
    return await items.update_item(user.id, record_id, item_id, payload)


@router.delete(config.RECORD_ITEM_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_coak_item(record_id: int, item_id: int, user: CurrentUser) -> None:
    """Delete one directory item."""
    await items.delete_item(user.id, record_id, item_id)



# ----- Workspace preferences
@router.get(
    config.RECORD_WORKSPACE_STATE_PATH,
    response_model=CoakWorkspaceStatePublic,
)
async def get_coak_workspace_state(
    record_id: int,
    user: CurrentUser,
) -> CoakWorkspaceStatePublic:
    """Return persisted layout state for one Coak record workspace."""
    return await workspace_state.get_workspace_state(user.id, record_id)


@router.patch(
    config.RECORD_WORKSPACE_STATE_PATH,
    response_model=CoakWorkspaceStatePublic,
)
async def update_coak_workspace_state(
    record_id: int,
    payload: CoakWorkspaceStateUpdate,
    user: CurrentUser,
) -> CoakWorkspaceStatePublic:
    """Persist layout state for one Coak record workspace."""
    return await workspace_state.update_workspace_state(user.id, record_id, payload)


@router.get(
    config.RECORD_WORKSPACE_SETTINGS_PATH,
    response_model=CoakWorkspaceSettingsPublic,
)
async def get_coak_workspace_settings(
    record_id: int,
    user: CurrentUser,
) -> CoakWorkspaceSettingsPublic:
    """Return persisted panel settings for one Coak record workspace."""
    return await workspace_settings.get_workspace_settings(user.id, record_id)


@router.patch(
    config.RECORD_WORKSPACE_SETTINGS_PATH,
    response_model=CoakWorkspaceSettingsPublic,
)
async def update_coak_workspace_settings(
    record_id: int,
    payload: CoakWorkspaceSettingsUpdate,
    user: CurrentUser,
) -> CoakWorkspaceSettingsPublic:
    """Persist panel settings for one Coak record workspace."""
    return await workspace_settings.update_workspace_settings(user.id, record_id, payload)


@router.get(
    config.RECORD_CONFIGURATION_SETTINGS_PATH,
    response_model=CoakConfigurationSettingsPublic,
)
async def get_coak_configuration_settings(
    record_id: int,
    user: CurrentUser,
) -> CoakConfigurationSettingsPublic:
    """Return persisted configuration settings for one Coak record workspace."""
    return await configuration_settings.get_configuration_settings(user.id, record_id)


@router.patch(
    config.RECORD_CONFIGURATION_SETTINGS_PATH,
    response_model=CoakConfigurationSettingsPublic,
)
async def update_coak_configuration_settings(
    record_id: int,
    payload: CoakConfigurationSettingsUpdate,
    user: CurrentUser,
) -> CoakConfigurationSettingsPublic:
    """Persist configuration settings for one Coak record workspace."""
    return await configuration_settings.update_configuration_settings(user.id, record_id, payload)
