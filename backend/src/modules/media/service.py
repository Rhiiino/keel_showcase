# keel_api/src/modules/media/service.py

"""Business logic for unified media storage and attachments."""

from __future__ import annotations

import hashlib
from uuid import UUID, uuid4

import asyncpg
from asyncpg.exceptions import UniqueViolationError

from core.database import get_pool
from core.errors import AppError
from core.storage import get_storage_backend
from core.storage.keys import build_user_media_key
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.media import access, config, repository, validation
from modules.media.schemas import (
    MediaAttachmentCreate,
    MediaAttachmentPublic,
    MediaAttachmentUpdate,
    MediaFolderContentsPublic,
    MediaFolderCreate,
    MediaFolderPublic,
    MediaFolderUpdate,
    MediaPublic,
    MediaUpdate,
)


def media_url(media_id: UUID) -> str:
    """Build the API URL for one media object."""
    return f"{config.ROUTE_PREFIX}/{media_id}"


def _record_to_media(
    row: asyncpg.Record,
    *,
    attachment_count: int = 0,
) -> MediaPublic:
    """Map a media_objects row to MediaPublic."""
    return MediaPublic(
        id=row["id"],
        user_id=row["user_id"],
        folder_id=row["folder_id"],
        original_filename=row["original_filename"],
        mime_type=row["mime_type"],
        byte_size=row["byte_size"],
        media_kind=row["media_kind"],
        status=row["status"],
        url=media_url(row["id"]),
        attachment_count=attachment_count,
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _record_to_folder(row: asyncpg.Record, *, byte_size: int = 0) -> MediaFolderPublic:
    """Map a media_folders row to MediaFolderPublic."""
    return MediaFolderPublic(
        id=row["id"],
        user_id=row["user_id"],
        parent_folder_id=row["parent_folder_id"],
        name=row["name"],
        byte_size=byte_size,
        sort_order=row["sort_order"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _record_to_attachment(
    attachment: asyncpg.Record,
    media_row: asyncpg.Record,
) -> MediaAttachmentPublic:
    """Map attachment + media rows to MediaAttachmentPublic."""
    return MediaAttachmentPublic(
        id=attachment["id"],
        media_id=attachment["media_id"],
        entity_type=attachment["entity_type"],
        entity_id=attachment["entity_id"],
        role=attachment["role"],
        sort_order=attachment["sort_order"],
        display_name=attachment["display_name"],
        project_folder_id=attachment.get("project_folder_id"),
        created_at=attachment["created_at"],
        media=_record_to_media(media_row),
    )



# ----- Folder helpers
async def _assert_owned_folder(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    folder_id: UUID,
) -> asyncpg.Record:
    row = await repository.get_media_folder_for_user(conn, folder_id, user_id)
    if row is None:
        raise AppError("Folder not found.", status_code=404)
    return row


async def _folder_depth(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    folder_id: UUID | None,
) -> int:
    depth = 0
    current = folder_id
    while current is not None:
        depth += 1
        if depth > config.MAX_FOLDER_DEPTH:
            break
        current = await repository.get_media_folder_parent_id(
            conn,
            user_id=user_id,
            folder_id=current,
        )
    return depth


async def _would_create_folder_cycle(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    folder_id: UUID,
    new_parent_id: UUID,
) -> bool:
    if folder_id == new_parent_id:
        return True
    current: UUID | None = new_parent_id
    depth = 0
    while current is not None and depth < config.MAX_FOLDER_DEPTH:
        if current == folder_id:
            return True
        current = await repository.get_media_folder_parent_id(
            conn,
            user_id=user_id,
            folder_id=current,
        )
        depth += 1
    return False


async def _validate_parent_folder(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    parent_folder_id: UUID | None,
) -> None:
    if parent_folder_id is None:
        return
    await _assert_owned_folder(conn, user_id=user_id, folder_id=parent_folder_id)
    depth = await _folder_depth(conn, user_id=user_id, folder_id=parent_folder_id)
    if depth >= config.MAX_FOLDER_DEPTH:
        raise AppError("Maximum folder depth exceeded.", status_code=400)



# ----- Upload and download
async def upload_media(
    user_id: int,
    *,
    filename: str,
    content_type: str,
    data: bytes,
    folder_id: UUID | None = None,
) -> MediaPublic:
    """Upload bytes to object storage and create a media_objects row."""
    mime = content_type or "application/octet-stream"
    media_kind = validation.validate_media_upload(mime, filename, data)
    extension = validation.extension_for_upload(mime, filename)
    media_id = uuid4()
    storage_key = build_user_media_key(user_id, media_id, extension)
    sha256 = hashlib.sha256(data).hexdigest()
    backend = get_storage_backend()

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            if folder_id is not None:
                await _validate_parent_folder(
                    conn,
                    user_id=user_id,
                    parent_folder_id=folder_id,
                )
            await repository.insert_media_object(
                conn,
                media_id=media_id,
                user_id=user_id,
                storage_key=storage_key,
                original_filename=filename or "upload",
                mime_type=mime,
                byte_size=len(data),
                media_kind=media_kind,
                status="pending",
                sha256=sha256,
                folder_id=folder_id,
            )

    try:
        await backend.put_object(storage_key, data, content_type=mime)
    except AppError:
        async with pool.acquire() as conn:
            await repository.delete_media_object(conn, media_id=media_id)
        raise
    except Exception as exc:
        async with pool.acquire() as conn:
            await repository.delete_media_object(conn, media_id=media_id)
        raise AppError("Failed to upload media.", status_code=502) from exc

    async with pool.acquire() as conn:
        row = await repository.update_media_object_ready(
            conn,
            media_id=media_id,
            byte_size=len(data),
            sha256=sha256,
        )
    if row is None:
        raise AppError("Failed to finalize media upload.", status_code=500)
    return _record_to_media(row)


async def get_media_metadata(user_id: int, media_id: UUID) -> MediaPublic:
    """Return metadata for one readable media object."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await access.assert_media_readable_by_user(
            conn,
            user_id=user_id,
            media_id=media_id,
        )
    return _record_to_media(row)


async def list_media(
    user_id: int,
    *,
    folder_id: UUID | None = None,
) -> MediaFolderContentsPublic:
    """List folders and media at one folder scope for the user."""
    pool = get_pool()
    async with pool.acquire() as conn:
        current_folder: asyncpg.Record | None = None
        breadcrumbs: list[asyncpg.Record] = []
        if folder_id is not None:
            current_folder = await _assert_owned_folder(
                conn,
                user_id=user_id,
                folder_id=folder_id,
            )
            breadcrumbs = await repository.list_folder_breadcrumbs(
                conn,
                user_id=user_id,
                folder_id=folder_id,
            )
        folders = await repository.list_media_folders_for_parent(
            conn,
            user_id,
            parent_folder_id=folder_id,
        )
        folder_byte_sizes = await repository.list_folder_subtree_byte_sizes(
            conn,
            user_id=user_id,
            folder_ids=[row["id"] for row in folders],
        )
        media_rows = await repository.list_media_objects_for_user(
            conn,
            user_id,
            folder_id=folder_id,
        )
        attachment_counts = await repository.count_attachments_for_media_ids(
            conn,
            [row["id"] for row in media_rows],
        )
    return MediaFolderContentsPublic(
        folder=_record_to_folder(current_folder) if current_folder else None,
        breadcrumbs=[_record_to_folder(row) for row in breadcrumbs],
        folders=[
            _record_to_folder(row, byte_size=folder_byte_sizes.get(row["id"], 0))
            for row in folders
        ],
        media=[
            _record_to_media(
                row,
                attachment_count=attachment_counts.get(row["id"], 0),
            )
            for row in media_rows
        ],
    )


async def list_all_media(user_id: int) -> list[MediaPublic]:
    """List all non-deleted media objects for the user (flat, any folder)."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_all_media_objects_for_user(conn, user_id)
    return [_record_to_media(row) for row in rows]


async def read_media_stream(
    user_id: int,
    media_id: UUID,
    *,
    range_header: str | None = None,
):
    """Return a stored object stream after access checks."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await access.assert_media_readable_by_user(
            conn,
            user_id=user_id,
            media_id=media_id,
        )
    backend = get_storage_backend()
    return await backend.get_object(row["storage_key"], range_header=range_header)


async def update_media(
    user_id: int,
    media_id: UUID,
    payload: MediaUpdate,
) -> MediaPublic:
    """Rename or move a media object owned by the user."""
    if payload.original_filename is None and "folder_id" not in payload.model_fields_set:
        raise AppError("No changes provided.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await repository.get_media_object_for_user(conn, media_id, user_id)
            if row is None:
                raise AppError("Media not found.", status_code=404)

            updated = row
            if payload.original_filename is not None:
                updated = await repository.update_media_object_filename(
                    conn,
                    media_id=media_id,
                    original_filename=payload.original_filename.strip(),
                )
                if updated is None:
                    raise AppError("Failed to update media.", status_code=500)

            if "folder_id" in payload.model_fields_set:
                if payload.folder_id is not None:
                    await _validate_parent_folder(
                        conn,
                        user_id=user_id,
                        parent_folder_id=payload.folder_id,
                    )
                moved = await repository.update_media_object_folder(
                    conn,
                    media_id=media_id,
                    folder_id=payload.folder_id,
                )
                if moved is None:
                    raise AppError("Failed to move media.", status_code=500)
                updated = moved
    return _record_to_media(updated)


async def replace_media_content(
    user_id: int,
    media_id: UUID,
    *,
    filename: str,
    content_type: str,
    data: bytes,
) -> MediaPublic:
    """Replace object bytes for an existing media row, preserving its id and attachments."""
    mime = content_type or "application/octet-stream"
    media_kind = validation.validate_media_upload(mime, filename, data)
    extension = validation.extension_for_upload(mime, filename)
    storage_key = build_user_media_key(user_id, media_id, extension)
    sha256 = hashlib.sha256(data).hexdigest()
    backend = get_storage_backend()

    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.get_media_object_for_user(conn, media_id, user_id)
        if row is None:
            raise AppError("Media not found.", status_code=404)
        old_storage_key = row["storage_key"]

    try:
        await backend.put_object(storage_key, data, content_type=mime)
    except AppError:
        raise
    except Exception as exc:
        raise AppError("Failed to replace media content.", status_code=502) from exc

    async with pool.acquire() as conn:
        updated = await repository.update_media_object_content(
            conn,
            media_id=media_id,
            storage_key=storage_key,
            original_filename=filename or row["original_filename"],
            mime_type=mime,
            byte_size=len(data),
            media_kind=media_kind,
            sha256=sha256,
        )
    if updated is None:
        try:
            await backend.delete_object(storage_key)
        except AppError:
            pass
        raise AppError("Failed to update media.", status_code=500)

    if old_storage_key != storage_key:
        try:
            await backend.delete_object(old_storage_key)
        except AppError:
            pass

    return _record_to_media(updated)


async def delete_media(user_id: int, media_id: UUID, *, bypass_trash: bool = False) -> None:
    """Delete a media object when it has no attachments."""
    if bypass_trash:
        backend = get_storage_backend()
        pool = get_pool()
        async with pool.acquire() as conn:
            async with conn.transaction():
                row = await repository.get_media_object_for_user(conn, media_id, user_id)
                if row is None:
                    raise AppError("Media not found.", status_code=404)
                attachment_count = await repository.count_attachments_for_media(conn, media_id)
                if attachment_count > 0:
                    raise AppError(
                        "Media is still attached to one or more entities.",
                        status_code=409,
                    )
                await repository.delete_media_object(conn, media_id=media_id)
        try:
            await backend.delete_object(row["storage_key"])
        except AppError:
            pass
        return

    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.get_media_object_for_user(conn, media_id, user_id)
        if row is None:
            raise AppError("Media not found.", status_code=404)
        attachment_count = await repository.count_attachments_for_media(conn, media_id)
        if attachment_count > 0:
            raise AppError(
                "Media is still attached to one or more entities.",
                status_code=409,
            )
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.MEDIA,
        str(media_id),
    )




# ----- Folders
async def create_folder(
    user_id: int,
    payload: MediaFolderCreate,
) -> MediaFolderPublic:
    """Create a folder at the root or under a parent folder."""
    name = payload.name.strip()
    if not name:
        raise AppError("Folder name is required.", status_code=400)
    if len(name) > config.MAX_FOLDER_NAME_LENGTH:
        raise AppError("Folder name is too long.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await _validate_parent_folder(
                conn,
                user_id=user_id,
                parent_folder_id=payload.parent_folder_id,
            )
            try:
                row = await repository.insert_media_folder(
                    conn,
                    folder_id=uuid4(),
                    user_id=user_id,
                    name=name,
                    parent_folder_id=payload.parent_folder_id,
                )
            except UniqueViolationError as exc:
                raise AppError(
                    "A folder with that name already exists here.",
                    status_code=409,
                ) from exc
    return _record_to_folder(row)


async def update_folder(
    user_id: int,
    folder_id: UUID,
    payload: MediaFolderUpdate,
) -> MediaFolderPublic:
    """Rename or move a folder."""
    if payload.name is None and "parent_folder_id" not in payload.model_fields_set:
        raise AppError("No changes provided.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await _assert_owned_folder(conn, user_id=user_id, folder_id=folder_id)
            updated = row

            if payload.name is not None:
                name = payload.name.strip()
                if not name:
                    raise AppError("Folder name is required.", status_code=400)
                try:
                    renamed = await repository.update_media_folder_name(
                        conn,
                        folder_id=folder_id,
                        name=name,
                    )
                except UniqueViolationError as exc:
                    raise AppError(
                        "A folder with that name already exists here.",
                        status_code=409,
                    ) from exc
                if renamed is None:
                    raise AppError("Failed to update folder.", status_code=500)
                updated = renamed

            if "parent_folder_id" in payload.model_fields_set:
                new_parent_id = payload.parent_folder_id
                if new_parent_id is not None:
                    await _validate_parent_folder(
                        conn,
                        user_id=user_id,
                        parent_folder_id=new_parent_id,
                    )
                    if await _would_create_folder_cycle(
                        conn,
                        user_id=user_id,
                        folder_id=folder_id,
                        new_parent_id=new_parent_id,
                    ):
                        raise AppError("Folder cannot be moved into itself.", status_code=400)
                    parent_depth = await _folder_depth(
                        conn,
                        user_id=user_id,
                        folder_id=new_parent_id,
                    )
                    if parent_depth >= config.MAX_FOLDER_DEPTH:
                        raise AppError("Maximum folder depth exceeded.", status_code=400)
                moved = await repository.update_media_folder_parent(
                    conn,
                    folder_id=folder_id,
                    parent_folder_id=new_parent_id,
                )
                if moved is None:
                    raise AppError("Failed to move folder.", status_code=500)
                updated = moved
    return _record_to_folder(updated)


async def delete_folder(user_id: int, folder_id: UUID) -> None:
    """Delete an empty folder via recently-deleted trash."""
    pool = get_pool()
    async with pool.acquire() as conn:
        await _assert_owned_folder(conn, user_id=user_id, folder_id=folder_id)
        child_folders = await repository.count_child_folders(
            conn,
            user_id=user_id,
            folder_id=folder_id,
        )
        if child_folders > 0:
            raise AppError("Folder is not empty.", status_code=409)
        media_count = await repository.count_media_in_folder(
            conn,
            user_id=user_id,
            folder_id=folder_id,
        )
        if media_count > 0:
            raise AppError("Folder is not empty.", status_code=409)
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.MEDIA_FOLDER,
        str(folder_id),
    )




# ----- Attachments
async def _get_media_row(conn: asyncpg.Connection, media_id: UUID) -> asyncpg.Record:
    row = await repository.get_media_object(conn, media_id)
    if row is None or row["status"] != "ready":
        raise AppError("Media not found.", status_code=404)
    return row


async def create_attachment(
    user_id: int,
    media_id: UUID,
    payload: MediaAttachmentCreate,
) -> MediaAttachmentPublic:
    """Attach ready media to an entity."""
    entity_type = payload.entity_type.strip()
    role = payload.role.strip()
    if entity_type not in config.VALID_ENTITY_TYPES:
        raise AppError("Invalid entity type.", status_code=400)
    if role not in config.VALID_ROLES:
        raise AppError("Invalid attachment role.", status_code=400)
    if payload.project_folder_id is not None:
        if entity_type != "project":
            raise AppError("Project folders apply only to project attachments.", status_code=400)
        if role != "gallery":
            raise AppError("Project folders apply only to gallery attachments.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            media_row = await repository.get_media_object_for_user(conn, media_id, user_id)
            if media_row is None or media_row["status"] != "ready":
                raise AppError("Media not found.", status_code=404)

            await access.assert_entity_owned_by_user(
                conn,
                user_id=user_id,
                entity_type=entity_type,
                entity_id=payload.entity_id,
            )

            if payload.project_folder_id is not None:
                from modules.projects.service.folders import assert_project_folder_for_attachment

                await assert_project_folder_for_attachment(
                    conn,
                    project_id=payload.entity_id,
                    project_folder_id=payload.project_folder_id,
                )

            if role in {"cover", "photo", "logo"}:
                await repository.delete_attachments_for_entity_role(
                    conn,
                    entity_type=entity_type,
                    entity_id=payload.entity_id,
                    role=role,
                )

            try:
                attachment = await repository.insert_attachment(
                    conn,
                    media_id=media_id,
                    entity_type=entity_type,
                    entity_id=payload.entity_id,
                    role=role,
                    sort_order=payload.sort_order,
                    display_name=payload.display_name,
                    project_folder_id=payload.project_folder_id,
                )
            except UniqueViolationError as exc:
                raise AppError("Attachment role already exists for this entity.", status_code=409) from exc

    return _record_to_attachment(attachment, media_row)


async def delete_attachment(user_id: int, attachment_id: int) -> None:
    """Remove one attachment after verifying entity ownership."""
    pool = get_pool()
    async with pool.acquire() as conn:
        attachment = await repository.get_attachment(conn, attachment_id)
        if attachment is None:
            raise AppError("Attachment not found.", status_code=404)
        await access.assert_entity_owned_by_user(
            conn,
            user_id=user_id,
            entity_type=attachment["entity_type"],
            entity_id=attachment["entity_id"],
        )
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.MEDIA_ATTACHMENT,
        str(attachment_id),
    )


async def update_attachment(
    user_id: int,
    attachment_id: int,
    payload: MediaAttachmentUpdate,
) -> MediaAttachmentPublic:
    """Update attachment metadata."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            attachment = await repository.get_attachment(conn, attachment_id)
            if attachment is None:
                raise AppError("Attachment not found.", status_code=404)
            await access.assert_entity_owned_by_user(
                conn,
                user_id=user_id,
                entity_type=attachment["entity_type"],
                entity_id=attachment["entity_id"],
            )
            if payload.role is not None and payload.role not in config.VALID_ROLES:
                raise AppError("Invalid attachment role.", status_code=400)
            if "project_folder_id" in payload.model_fields_set:
                folder_id = payload.project_folder_id
                if folder_id is not None:
                    if attachment["entity_type"] != "project":
                        raise AppError(
                            "Project folders apply only to project attachments.",
                            status_code=400,
                        )
                    if attachment["role"] != "gallery":
                        raise AppError(
                            "Project folders apply only to gallery attachments.",
                            status_code=400,
                        )
                    from modules.projects.service.folders import assert_project_folder_for_attachment

                    await assert_project_folder_for_attachment(
                        conn,
                        project_id=attachment["entity_id"],
                        project_folder_id=folder_id,
                    )
            update_kwargs: dict = {
                "role": payload.role,
                "sort_order": payload.sort_order,
                "display_name": payload.display_name,
            }
            if "project_folder_id" in payload.model_fields_set:
                update_kwargs["project_folder_id"] = payload.project_folder_id
            updated = await repository.update_attachment(
                conn,
                attachment_id=attachment_id,
                **update_kwargs,
            )
            media_row = await _get_media_row(conn, attachment["media_id"])
    if updated is None:
        raise AppError("Failed to update attachment.", status_code=500)
    return _record_to_attachment(updated, media_row)


async def list_for_media(
    user_id: int,
    media_id: UUID,
) -> list[MediaAttachmentPublic]:
    """List all attachments for one media object owned by the user."""
    pool = get_pool()
    async with pool.acquire() as conn:
        media_row = await repository.get_media_object_for_user(conn, media_id, user_id)
        if media_row is None:
            raise AppError("Media not found.", status_code=404)
        attachments = await repository.list_attachments_for_media(conn, media_id=media_id)
        return [_record_to_attachment(attachment, media_row) for attachment in attachments]


async def list_for_entity(
    user_id: int,
    entity_type: str,
    entity_id: int,
) -> list[MediaAttachmentPublic]:
    """List all attachments (with media metadata) for one entity."""
    if entity_type not in config.VALID_ENTITY_TYPES:
        raise AppError("Invalid entity type.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        await access.assert_entity_owned_by_user(
            conn,
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        attachments = await repository.list_attachments_for_entity(
            conn,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        results: list[MediaAttachmentPublic] = []
        for attachment in attachments:
            media_row = await _get_media_row(conn, attachment["media_id"])
            results.append(_record_to_attachment(attachment, media_row))
    return results


async def get_attachment_for_entity_role(
    conn: asyncpg.Connection,
    *,
    entity_type: str,
    entity_id: int,
    role: str,
) -> MediaAttachmentPublic | None:
    """Return the first attachment for an entity role (internal helper)."""
    attachments = await repository.list_attachments_for_entity_role(
        conn,
        entity_type=entity_type,
        entity_id=entity_id,
        role=role,
    )
    if not attachments:
        return None
    media_row = await _get_media_row(conn, attachments[0]["media_id"])
    return _record_to_attachment(attachments[0], media_row)


async def list_gallery_for_entity(
    conn: asyncpg.Connection,
    *,
    entity_type: str,
    entity_id: int,
) -> list[MediaAttachmentPublic]:
    """Return gallery attachments for an entity (internal helper)."""
    attachments = await repository.list_attachments_for_entity_role(
        conn,
        entity_type=entity_type,
        entity_id=entity_id,
        role="gallery",
    )
    results: list[MediaAttachmentPublic] = []
    for attachment in attachments:
        media_row = await repository.get_media_object(conn, attachment["media_id"])
        if media_row is None or media_row["status"] != "ready":
            continue
        results.append(_record_to_attachment(attachment, media_row))
    return results


async def detach_cover(
    user_id: int,
    *,
    entity_type: str,
    entity_id: int,
) -> None:
    """Remove cover attachment from an entity."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await access.assert_entity_owned_by_user(
                conn,
                user_id=user_id,
                entity_type=entity_type,
                entity_id=entity_id,
            )
            await repository.delete_attachments_for_entity_role(
                conn,
                entity_type=entity_type,
                entity_id=entity_id,
                role="cover",
            )
