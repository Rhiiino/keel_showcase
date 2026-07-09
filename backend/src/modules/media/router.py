# keel_api/src/modules/media/router.py

"""HTTP routes for unified media storage."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, Request, Response, UploadFile, status

from core.storage.streaming import streaming_object_response
from core.cors import cors_headers_for_request
from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.media import config, service
from modules.media.schemas import (
    MediaAttachmentCreate,
    MediaAttachmentPublic,
    MediaAttachmentUpdate,
    MediaFolderContentsPublic,
    MediaFolderCreate,
    MediaFolderPublic,
    MediaFolderUpdate,
    MediaPanelCreate,
    MediaPanelDetailPublic,
    MediaPanelItemCreate,
    MediaPanelItemPublic,
    MediaPanelItemSwap,
    MediaPanelItemUpdate,
    MediaPanelLayoutUpdate,
    MediaPanelPublic,
    MediaPanelUpdate,
    MediaPublic,
    MediaUpdate,
)
from modules.media import panel_service

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]



# ----- Panels (register before /{media_id} routes)
@router.get(config.PANELS_PATH, response_model=list[MediaPanelPublic])
async def list_panels(user: CurrentUser) -> list[MediaPanelPublic]:
    """List display panels for the current user."""
    return await panel_service.list_panels(user.id)


@router.post(
    config.PANELS_PATH,
    response_model=MediaPanelPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_panel(payload: MediaPanelCreate, user: CurrentUser) -> MediaPanelPublic:
    """Create a display panel."""
    return await panel_service.create_panel(user.id, payload)


@router.get(config.PANEL_BY_ID_PATH, response_model=MediaPanelDetailPublic)
async def get_panel(panel_id: UUID, user: CurrentUser) -> MediaPanelDetailPublic:
    """Fetch one panel with all tiles."""
    return await panel_service.get_panel(user.id, panel_id)


@router.patch(config.PANEL_BY_ID_PATH, response_model=MediaPanelPublic)
async def update_panel(
    panel_id: UUID,
    payload: MediaPanelUpdate,
    user: CurrentUser,
) -> MediaPanelPublic:
    """Rename a display panel."""
    return await panel_service.update_panel(user.id, panel_id, payload)


@router.delete(config.PANEL_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_panel(panel_id: UUID, user: CurrentUser) -> Response:
    """Soft-delete a display panel."""
    await panel_service.delete_panel(user.id, panel_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    config.PANEL_ITEMS_PATH,
    response_model=MediaPanelItemPublic,
    status_code=status.HTTP_201_CREATED,
)
async def add_panel_item(
    panel_id: UUID,
    payload: MediaPanelItemCreate,
    user: CurrentUser,
) -> MediaPanelItemPublic:
    """Add one media tile to a panel."""
    return await panel_service.add_panel_item(user.id, panel_id, payload)


@router.patch(config.PANEL_ITEM_BY_ID_PATH, response_model=MediaPanelItemPublic)
async def update_panel_item(
    panel_id: UUID,
    item_id: UUID,
    payload: MediaPanelItemUpdate,
    user: CurrentUser,
) -> MediaPanelItemPublic:
    """Update one tile placement."""
    return await panel_service.update_panel_item(user.id, panel_id, item_id, payload)


@router.post(config.PANEL_ITEMS_SWAP_PATH, response_model=MediaPanelDetailPublic)
async def swap_panel_items(
    panel_id: UUID,
    payload: MediaPanelItemSwap,
    user: CurrentUser,
) -> MediaPanelDetailPublic:
    """Swap grid placements between two tiles."""
    return await panel_service.swap_panel_items(user.id, panel_id, payload)


@router.put(config.PANEL_LAYOUT_PATH, response_model=MediaPanelDetailPublic)
async def replace_panel_layout(
    panel_id: UUID,
    payload: MediaPanelLayoutUpdate,
    user: CurrentUser,
) -> MediaPanelDetailPublic:
    """Batch-update tile placements after reflow."""
    return await panel_service.replace_panel_layout(user.id, panel_id, payload)


@router.delete(config.PANEL_ITEM_BY_ID_PATH, response_model=MediaPanelDetailPublic)
async def remove_panel_item(
    panel_id: UUID,
    item_id: UUID,
    user: CurrentUser,
) -> MediaPanelDetailPublic:
    """Remove one tile from a panel."""
    return await panel_service.remove_panel_item(user.id, panel_id, item_id)




# ----- Media objects
@router.get(config.ALL_MEDIA_PATH, response_model=list[MediaPublic])
async def list_all_media(user: CurrentUser) -> list[MediaPublic]:
    """List all non-deleted media objects for the current user (flat)."""
    return await service.list_all_media(user.id)


@router.get(config.LIST_PATH, response_model=MediaFolderContentsPublic)
async def list_media(
    user: CurrentUser,
    folder_id: UUID | None = Query(default=None),
) -> MediaFolderContentsPublic:
    """List folders and media at one folder scope for the current user."""
    return await service.list_media(user.id, folder_id=folder_id)


@router.post(config.LIST_PATH, response_model=MediaPublic, status_code=status.HTTP_201_CREATED)
async def upload_media(
    user: CurrentUser,
    file: UploadFile = File(...),
    folder_id: UUID | None = Form(default=None),
) -> MediaPublic:
    """Upload a media file to object storage."""
    data = await file.read()
    return await service.upload_media(
        user.id,
        filename=file.filename or "upload",
        content_type=file.content_type or "application/octet-stream",
        data=data,
        folder_id=folder_id,
    )


@router.get(config.MEDIA_BY_ID_PATH)
async def download_media(
    media_id: UUID,
    user: CurrentUser,
    request: Request,
) -> Response:
    """Stream a media file; supports HTTP Range for video/audio."""
    range_header = request.headers.get("range")
    stored = await service.read_media_stream(
        user.id,
        media_id,
        range_header=range_header,
    )
    status_code = 206 if range_header else 200
    content_range = stored.content_range if range_header else None
    return streaming_object_response(
        body=stored.body,
        content_type=stored.content_type,
        content_length=stored.content_length,
        content_range=content_range,
        status_code=status_code,
        extra_headers=cors_headers_for_request(request),
    )


@router.get(config.MEDIA_METADATA_PATH, response_model=MediaPublic)
async def get_media_metadata(media_id: UUID, user: CurrentUser) -> MediaPublic:
    """Return metadata for one media object."""
    return await service.get_media_metadata(user.id, media_id)


@router.patch(config.MEDIA_BY_ID_PATH, response_model=MediaPublic)
async def update_media(
    media_id: UUID,
    payload: MediaUpdate,
    user: CurrentUser,
) -> MediaPublic:
    """Rename or move a media object."""
    return await service.update_media(user.id, media_id, payload)


@router.put(config.MEDIA_CONTENT_PATH, response_model=MediaPublic)
async def replace_media_content(
    media_id: UUID,
    user: CurrentUser,
    file: UploadFile = File(...),
    original_filename: str | None = Form(None),
) -> MediaPublic:
    """Replace the stored bytes for an existing media object."""
    data = await file.read()
    filename = (original_filename or file.filename or "upload").strip()
    return await service.replace_media_content(
        user.id,
        media_id,
        filename=filename,
        content_type=file.content_type or "application/octet-stream",
        data=data,
    )


@router.delete(config.MEDIA_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_media(media_id: UUID, user: CurrentUser) -> Response:
    """Delete a media object that is not attached anywhere."""
    await service.delete_media(user.id, media_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)




# ----- Folders
@router.post(
    config.FOLDERS_PATH,
    response_model=MediaFolderPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_folder(
    payload: MediaFolderCreate,
    user: CurrentUser,
) -> MediaFolderPublic:
    """Create a media folder."""
    return await service.create_folder(user.id, payload)


@router.patch(config.FOLDER_BY_ID_PATH, response_model=MediaFolderPublic)
async def update_folder(
    folder_id: UUID,
    payload: MediaFolderUpdate,
    user: CurrentUser,
) -> MediaFolderPublic:
    """Rename or move a media folder."""
    return await service.update_folder(user.id, folder_id, payload)


@router.delete(config.FOLDER_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(folder_id: UUID, user: CurrentUser) -> Response:
    """Delete an empty media folder."""
    await service.delete_folder(user.id, folder_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)




# ----- Attachments
@router.get(config.MEDIA_ATTACHMENTS_PATH, response_model=list[MediaAttachmentPublic])
async def list_attachments_for_media(
    media_id: UUID,
    user: CurrentUser,
) -> list[MediaAttachmentPublic]:
    """List attachments referencing one media object."""
    return await service.list_for_media(user.id, media_id)


@router.post(
    config.MEDIA_ATTACHMENTS_PATH,
    response_model=MediaAttachmentPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_attachment(
    media_id: UUID,
    payload: MediaAttachmentCreate,
    user: CurrentUser,
) -> MediaAttachmentPublic:
    """Attach media to an entity."""
    return await service.create_attachment(user.id, media_id, payload)


@router.delete(config.ATTACHMENT_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(attachment_id: int, user: CurrentUser) -> Response:
    """Detach media from an entity."""
    await service.delete_attachment(user.id, attachment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch(config.ATTACHMENT_BY_ID_PATH, response_model=MediaAttachmentPublic)
async def update_attachment(
    attachment_id: int,
    payload: MediaAttachmentUpdate,
    user: CurrentUser,
) -> MediaAttachmentPublic:
    """Update attachment metadata."""
    return await service.update_attachment(user.id, attachment_id, payload)


@router.get(config.BY_ENTITY_PATH, response_model=list[MediaAttachmentPublic])
async def list_attachments_for_entity(
    entity_type: str,
    entity_id: int,
    user: CurrentUser,
) -> list[MediaAttachmentPublic]:
    """List attachments for one entity."""
    return await service.list_for_entity(user.id, entity_type, entity_id)
