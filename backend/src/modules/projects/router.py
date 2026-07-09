# keel_api/src/modules/projects/router.py

"""HTTP routes for personal projects (session required)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.projects import config
from modules.projects.service import canvases_service, folders_service, service
from modules.projects.schemas import (
    ProjectCanvasCreate,
    ProjectCanvasPublic,
    ProjectCanvasUpdate,
    ProjectCreate,
    ProjectFolderCreate,
    ProjectFolderPublic,
    ProjectFolderUpdate,
    ProjectPublic,
    ProjectTagCreate,
    ProjectTagPublic,
    ProjectTagUpdate,
    ProjectUpdate,
    ProjectWorkspacePublic,
    ProjectWorkspaceSettingsPublic,
    ProjectWorkspaceSettingsUpdate,
    ProjectWorkspaceUpdate,
)

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]



# ----- Project tags
@router.get(config.TAG_LIST_PATH, response_model=list[ProjectTagPublic])
async def list_project_tags(user: CurrentUser) -> list[ProjectTagPublic]:
    """List the current user's project tags."""
    return await service.list_project_tags(user.id)


@router.post(
    config.TAG_LIST_PATH,
    response_model=ProjectTagPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_project_tag(
    payload: ProjectTagCreate,
    user: CurrentUser,
) -> ProjectTagPublic:
    """Create a project tag for the current user."""
    return await service.create_project_tag(user.id, payload)


@router.patch(config.TAG_BY_ID_PATH, response_model=ProjectTagPublic)
async def update_project_tag(
    tag_id: int,
    payload: ProjectTagUpdate,
    user: CurrentUser,
) -> ProjectTagPublic:
    """Update one project tag."""
    return await service.update_project_tag(user.id, tag_id, payload)


@router.delete(config.TAG_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_tag(tag_id: int, user: CurrentUser) -> None:
    """Delete one project tag."""
    await service.delete_project_tag(user.id, tag_id)



# ----- Projects
@router.get(config.LIST_PATH, response_model=list[ProjectPublic])
async def list_projects(user: CurrentUser) -> list[ProjectPublic]:
    """List the current user's projects, most recently updated first."""
    return await service.list_projects(user.id)


@router.post(
    config.LIST_PATH,
    response_model=ProjectPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_project(
    payload: ProjectCreate,
    user: CurrentUser,
) -> ProjectPublic:
    """Create a new project owned by the current user."""
    return await service.create_project(user.id, payload)


@router.get(config.PROJECT_BY_ID_PATH, response_model=ProjectPublic)
async def get_project(project_id: int, user: CurrentUser) -> ProjectPublic:
    """Fetch one project owned by the current user."""
    return await service.get_project(user.id, project_id)


@router.patch(config.PROJECT_BY_ID_PATH, response_model=ProjectPublic)
async def update_project(
    project_id: int,
    payload: ProjectUpdate,
    user: CurrentUser,
) -> ProjectPublic:
    """Update project metadata."""
    return await service.update_project(user.id, project_id, payload)


@router.delete(config.PROJECT_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: int, user: CurrentUser) -> None:
    """Delete a project."""
    await service.delete_project(user.id, project_id)



# ----- Workspace (default canvas aliases)
@router.get(config.PROJECT_WORKSPACE_PATH, response_model=ProjectWorkspacePublic)
async def get_project_workspace(
    project_id: int,
    user: CurrentUser,
) -> ProjectWorkspacePublic:
    """Fetch the default workspace canvas state for a project."""
    return await service.get_default_workspace(user.id, project_id)


@router.put(config.PROJECT_WORKSPACE_PATH, response_model=ProjectWorkspacePublic)
async def replace_project_workspace(
    project_id: int,
    payload: ProjectWorkspaceUpdate,
    user: CurrentUser,
) -> ProjectWorkspacePublic:
    """Replace the default workspace canvas state for a project."""
    return await service.replace_default_workspace(user.id, project_id, payload.state)


@router.get(
    config.PROJECT_WORKSPACE_SETTINGS_PATH,
    response_model=ProjectWorkspaceSettingsPublic,
)
async def get_project_workspace_settings(
    project_id: int,
    user: CurrentUser,
) -> ProjectWorkspaceSettingsPublic:
    """Return persisted default workspace canvas UI settings for a project."""
    return await service.get_default_workspace_settings(user.id, project_id)


@router.patch(
    config.PROJECT_WORKSPACE_SETTINGS_PATH,
    response_model=ProjectWorkspaceSettingsPublic,
)
async def update_project_workspace_settings(
    project_id: int,
    payload: ProjectWorkspaceSettingsUpdate,
    user: CurrentUser,
) -> ProjectWorkspaceSettingsPublic:
    """Persist default workspace canvas UI settings for a project."""
    return await service.update_default_workspace_settings(
        user.id,
        project_id,
        payload,
    )



# ----- Project canvases
@router.get(config.PROJECT_CANVASES_PATH, response_model=list[ProjectCanvasPublic])
async def list_project_canvases(
    project_id: int,
    user: CurrentUser,
) -> list[ProjectCanvasPublic]:
    """List workspace canvases for a project."""
    return await canvases_service.list_project_canvases(user.id, project_id)


@router.post(
    config.PROJECT_CANVASES_PATH,
    response_model=ProjectCanvasPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_project_canvas(
    project_id: int,
    payload: ProjectCanvasCreate,
    user: CurrentUser,
) -> ProjectCanvasPublic:
    """Create a workspace canvas for a project."""
    return await canvases_service.create_project_canvas(user.id, project_id, payload)


@router.patch(
    config.PROJECT_CANVAS_BY_ID_PATH,
    response_model=ProjectCanvasPublic,
)
async def update_project_canvas(
    project_id: int,
    canvas_id: int,
    payload: ProjectCanvasUpdate,
    user: CurrentUser,
) -> ProjectCanvasPublic:
    """Update workspace canvas metadata."""
    return await canvases_service.update_project_canvas(
        user.id,
        project_id,
        canvas_id,
        payload,
    )


@router.delete(
    config.PROJECT_CANVAS_BY_ID_PATH,
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_project_canvas(
    project_id: int,
    canvas_id: int,
    user: CurrentUser,
) -> None:
    """Delete one workspace canvas."""
    await canvases_service.delete_project_canvas(user.id, project_id, canvas_id)


@router.get(
    config.PROJECT_CANVAS_WORKSPACE_PATH,
    response_model=ProjectWorkspacePublic,
)
async def get_project_canvas_workspace(
    project_id: int,
    canvas_id: int,
    user: CurrentUser,
) -> ProjectWorkspacePublic:
    """Fetch workspace canvas state for one canvas."""
    return await service.get_workspace(user.id, project_id, canvas_id)


@router.put(
    config.PROJECT_CANVAS_WORKSPACE_PATH,
    response_model=ProjectWorkspacePublic,
)
async def replace_project_canvas_workspace(
    project_id: int,
    canvas_id: int,
    payload: ProjectWorkspaceUpdate,
    user: CurrentUser,
) -> ProjectWorkspacePublic:
    """Replace workspace canvas state for one canvas."""
    return await service.replace_workspace(
        user.id,
        project_id,
        canvas_id,
        payload.state,
    )


@router.get(
    config.PROJECT_CANVAS_WORKSPACE_SETTINGS_PATH,
    response_model=ProjectWorkspaceSettingsPublic,
)
async def get_project_canvas_workspace_settings(
    project_id: int,
    canvas_id: int,
    user: CurrentUser,
) -> ProjectWorkspaceSettingsPublic:
    """Return persisted workspace canvas UI settings for one canvas."""
    return await service.get_workspace_settings(user.id, project_id, canvas_id)


@router.patch(
    config.PROJECT_CANVAS_WORKSPACE_SETTINGS_PATH,
    response_model=ProjectWorkspaceSettingsPublic,
)
async def update_project_canvas_workspace_settings(
    project_id: int,
    canvas_id: int,
    payload: ProjectWorkspaceSettingsUpdate,
    user: CurrentUser,
) -> ProjectWorkspaceSettingsPublic:
    """Persist workspace canvas UI settings for one canvas."""
    return await service.update_workspace_settings(
        user.id,
        project_id,
        canvas_id,
        payload,
    )



# ----- Project folders
@router.get(config.PROJECT_FOLDERS_PATH, response_model=list[ProjectFolderPublic])
async def list_project_folders(
    project_id: int,
    user: CurrentUser,
    parent_folder_id: UUID | None = Query(default=None),
    all_folders: bool = Query(default=False),
) -> list[ProjectFolderPublic]:
    """List folders at one parent scope, or all folders for a project."""
    return await folders_service.list_project_folders(
        user.id,
        project_id,
        parent_folder_id=parent_folder_id,
        all_folders=all_folders,
    )


@router.post(
    config.PROJECT_FOLDERS_PATH,
    response_model=ProjectFolderPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_project_folder(
    project_id: int,
    payload: ProjectFolderCreate,
    user: CurrentUser,
) -> ProjectFolderPublic:
    """Create a folder under a parent or at the project root."""
    return await folders_service.create_project_folder(user.id, project_id, payload)


@router.patch(config.PROJECT_FOLDER_BY_ID_PATH, response_model=ProjectFolderPublic)
async def update_project_folder(
    project_id: int,
    folder_id: UUID,
    payload: ProjectFolderUpdate,
    user: CurrentUser,
) -> ProjectFolderPublic:
    """Rename, reorder, or move a project folder."""
    return await folders_service.update_project_folder(
        user.id,
        project_id,
        folder_id,
        payload,
    )


@router.delete(config.PROJECT_FOLDER_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_folder(
    project_id: int,
    folder_id: UUID,
    user: CurrentUser,
) -> None:
    """Delete an empty project folder."""
    await folders_service.delete_project_folder(user.id, project_id, folder_id)
