# keel_api/src/modules/media/repository.py

"""SQL access for media_objects and media_attachments."""

from __future__ import annotations

from uuid import UUID

import asyncpg

from core.tables import MEDIA_ATTACHMENTS, MEDIA_FOLDERS, MEDIA_OBJECTS, MEDIA_PANEL_ITEMS, MEDIA_PANELS

_OBJECT_COLUMNS = (
    "id, user_id, folder_id, storage_key, original_filename, mime_type, byte_size, "
    "media_kind, status, sha256, created_at, updated_at"
)

_FOLDER_COLUMNS = (
    "id, user_id, parent_folder_id, name, sort_order, created_at, updated_at"
)

_ATTACHMENT_COLUMNS = (
    "id, media_id, entity_type, entity_id, role, sort_order, display_name, "
    "project_folder_id, created_at"
)



# ----- Media objects
async def insert_media_object(
    conn: asyncpg.Connection,
    *,
    media_id: UUID,
    user_id: int,
    storage_key: str,
    original_filename: str,
    mime_type: str,
    byte_size: int,
    media_kind: str,
    status: str,
    sha256: str | None = None,
    folder_id: UUID | None = None,
) -> asyncpg.Record:
    """Insert a pending or ready media object row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {MEDIA_OBJECTS} (
            id, user_id, folder_id, storage_key, original_filename, mime_type,
            byte_size, media_kind, status, sha256
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING {_OBJECT_COLUMNS}
        """,
        media_id,
        user_id,
        folder_id,
        storage_key,
        original_filename,
        mime_type,
        byte_size,
        media_kind,
        status,
        sha256,
    )
    if row is None:
        raise RuntimeError("Failed to insert media object.")
    return row


async def get_media_object(
    conn: asyncpg.Connection,
    media_id: UUID,
) -> asyncpg.Record | None:
    """Fetch one media object by id."""
    return await conn.fetchrow(
        f"""
        SELECT {_OBJECT_COLUMNS}
        FROM {MEDIA_OBJECTS}
        WHERE id = $1 AND status <> 'deleted'
        """,
        media_id,
    )


async def get_media_object_for_user(
    conn: asyncpg.Connection,
    media_id: UUID,
    user_id: int,
) -> asyncpg.Record | None:
    """Fetch one media object owned by a user."""
    return await conn.fetchrow(
        f"""
        SELECT {_OBJECT_COLUMNS}
        FROM {MEDIA_OBJECTS}
        WHERE id = $1 AND user_id = $2 AND status <> 'deleted'
        """,
        media_id,
        user_id,
    )


async def list_media_objects_for_user(
    conn: asyncpg.Connection,
    user_id: int,
    *,
    folder_id: UUID | None = None,
) -> list[asyncpg.Record]:
    """List non-deleted media objects for one user at a folder scope."""
    if folder_id is None:
        return await conn.fetch(
            f"""
            SELECT {_OBJECT_COLUMNS}
            FROM {MEDIA_OBJECTS}
            WHERE user_id = $1 AND folder_id IS NULL AND status <> 'deleted'
            ORDER BY created_at DESC
            """,
            user_id,
        )
    return await conn.fetch(
        f"""
        SELECT {_OBJECT_COLUMNS}
        FROM {MEDIA_OBJECTS}
        WHERE user_id = $1 AND folder_id = $2 AND status <> 'deleted'
        ORDER BY created_at DESC
        """,
        user_id,
        folder_id,
    )


async def list_all_media_objects_for_user(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List all non-deleted media objects for one user (flat, any folder)."""
    return await conn.fetch(
        f"""
        SELECT {_OBJECT_COLUMNS}
        FROM {MEDIA_OBJECTS}
        WHERE user_id = $1 AND status <> 'deleted'
        ORDER BY created_at DESC
        """,
        user_id,
    )


async def update_media_object_ready(
    conn: asyncpg.Connection,
    *,
    media_id: UUID,
    byte_size: int,
    sha256: str | None = None,
) -> asyncpg.Record | None:
    """Mark a media object ready after upload."""
    return await conn.fetchrow(
        f"""
        UPDATE {MEDIA_OBJECTS}
        SET status = 'ready', byte_size = $2, sha256 = $3, updated_at = NOW()
        WHERE id = $1
        RETURNING {_OBJECT_COLUMNS}
        """,
        media_id,
        byte_size,
        sha256,
    )


async def update_media_object_filename(
    conn: asyncpg.Connection,
    *,
    media_id: UUID,
    original_filename: str,
) -> asyncpg.Record | None:
    """Rename a media object."""
    return await conn.fetchrow(
        f"""
        UPDATE {MEDIA_OBJECTS}
        SET original_filename = $2, updated_at = NOW()
        WHERE id = $1 AND status <> 'deleted'
        RETURNING {_OBJECT_COLUMNS}
        """,
        media_id,
        original_filename,
    )


async def update_media_object_folder(
    conn: asyncpg.Connection,
    *,
    media_id: UUID,
    folder_id: UUID | None,
) -> asyncpg.Record | None:
    """Move a media object to a folder or the root."""
    return await conn.fetchrow(
        f"""
        UPDATE {MEDIA_OBJECTS}
        SET folder_id = $2, updated_at = NOW()
        WHERE id = $1 AND status <> 'deleted'
        RETURNING {_OBJECT_COLUMNS}
        """,
        media_id,
        folder_id,
    )


async def update_media_object_content(
    conn: asyncpg.Connection,
    *,
    media_id: UUID,
    storage_key: str,
    original_filename: str,
    mime_type: str,
    byte_size: int,
    media_kind: str,
    sha256: str | None = None,
) -> asyncpg.Record | None:
    """Replace stored bytes and metadata for an existing media object."""
    return await conn.fetchrow(
        f"""
        UPDATE {MEDIA_OBJECTS}
        SET
            storage_key = $2,
            original_filename = $3,
            mime_type = $4,
            byte_size = $5,
            media_kind = $6,
            sha256 = $7,
            status = 'ready',
            updated_at = NOW()
        WHERE id = $1 AND status <> 'deleted'
        RETURNING {_OBJECT_COLUMNS}
        """,
        media_id,
        storage_key,
        original_filename,
        mime_type,
        byte_size,
        media_kind,
        sha256,
    )


async def mark_media_object_deleted(
    conn: asyncpg.Connection,
    *,
    media_id: UUID,
) -> asyncpg.Record | None:
    """Soft-delete a media object row."""
    return await conn.fetchrow(
        f"""
        UPDATE {MEDIA_OBJECTS}
        SET status = 'deleted', updated_at = NOW()
        WHERE id = $1
        RETURNING {_OBJECT_COLUMNS}
        """,
        media_id,
    )


async def delete_media_object(
    conn: asyncpg.Connection,
    *,
    media_id: UUID,
) -> asyncpg.Record | None:
    """Hard-delete a media object row."""
    return await conn.fetchrow(
        f"""
        DELETE FROM {MEDIA_OBJECTS}
        WHERE id = $1
        RETURNING {_OBJECT_COLUMNS}
        """,
        media_id,
    )


async def count_attachments_for_media(
    conn: asyncpg.Connection,
    media_id: UUID,
) -> int:
    """Count attachments referencing a media object."""
    return int(
        await conn.fetchval(
            f"""
            SELECT COUNT(*)
            FROM {MEDIA_ATTACHMENTS}
            WHERE media_id = $1
            """,
            media_id,
        )
        or 0
    )


async def count_attachments_for_media_ids(
    conn: asyncpg.Connection,
    media_ids: list[UUID],
) -> dict[UUID, int]:
    """Count attachments for many media objects in one query."""
    if not media_ids:
        return {}
    rows = await conn.fetch(
        f"""
        SELECT media_id, COUNT(*) AS attachment_count
        FROM {MEDIA_ATTACHMENTS}
        WHERE media_id = ANY($1::uuid[])
        GROUP BY media_id
        """,
        media_ids,
    )
    return {row["media_id"]: int(row["attachment_count"]) for row in rows}


async def count_media_in_folder(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    folder_id: UUID,
) -> int:
    """Count non-deleted media objects in one folder."""
    return int(
        await conn.fetchval(
            f"""
            SELECT COUNT(*)
            FROM {MEDIA_OBJECTS}
            WHERE user_id = $1 AND folder_id = $2 AND status <> 'deleted'
            """,
            user_id,
            folder_id,
        )
        or 0
    )




# ----- Media folders
async def insert_media_folder(
    conn: asyncpg.Connection,
    *,
    folder_id: UUID,
    user_id: int,
    name: str,
    parent_folder_id: UUID | None = None,
    sort_order: int = 0,
) -> asyncpg.Record:
    """Insert one media folder row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {MEDIA_FOLDERS} (
            id, user_id, parent_folder_id, name, sort_order
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING {_FOLDER_COLUMNS}
        """,
        folder_id,
        user_id,
        parent_folder_id,
        name,
        sort_order,
    )
    if row is None:
        raise RuntimeError("Failed to insert media folder.")
    return row


async def get_media_folder_for_user(
    conn: asyncpg.Connection,
    folder_id: UUID,
    user_id: int,
) -> asyncpg.Record | None:
    """Fetch one non-deleted folder owned by a user."""
    return await conn.fetchrow(
        f"""
        SELECT {_FOLDER_COLUMNS}
        FROM {MEDIA_FOLDERS}
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        """,
        folder_id,
        user_id,
    )


async def list_media_folders_for_parent(
    conn: asyncpg.Connection,
    user_id: int,
    *,
    parent_folder_id: UUID | None = None,
) -> list[asyncpg.Record]:
    """List child folders at one parent scope."""
    if parent_folder_id is None:
        return await conn.fetch(
            f"""
            SELECT {_FOLDER_COLUMNS}
            FROM {MEDIA_FOLDERS}
            WHERE user_id = $1 AND parent_folder_id IS NULL AND deleted_at IS NULL
            ORDER BY sort_order ASC, lower(name) ASC, id ASC
            """,
            user_id,
        )
    return await conn.fetch(
        f"""
        SELECT {_FOLDER_COLUMNS}
        FROM {MEDIA_FOLDERS}
        WHERE user_id = $1 AND parent_folder_id = $2 AND deleted_at IS NULL
        ORDER BY sort_order ASC, lower(name) ASC, id ASC
        """,
        user_id,
        parent_folder_id,
    )


async def list_folder_subtree_byte_sizes(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    folder_ids: list[UUID],
) -> dict[UUID, int]:
    """Return cumulative non-deleted media bytes for each folder subtree."""
    if not folder_ids:
        return {}

    rows = await conn.fetch(
        f"""
        WITH RECURSIVE folder_tree AS (
            SELECT id AS root_id, id
            FROM {MEDIA_FOLDERS}
            WHERE user_id = $1 AND id = ANY($2::uuid[]) AND deleted_at IS NULL
            UNION ALL
            SELECT folder_tree.root_id, child.id
            FROM {MEDIA_FOLDERS} child
            INNER JOIN folder_tree ON child.parent_folder_id = folder_tree.id
            WHERE child.user_id = $1 AND child.deleted_at IS NULL
        )
        SELECT
            folder_tree.root_id,
            COALESCE(SUM(media.byte_size), 0)::bigint AS byte_size
        FROM folder_tree
        LEFT JOIN {MEDIA_OBJECTS} media
            ON media.folder_id = folder_tree.id
            AND media.user_id = $1
            AND media.status <> 'deleted'
        GROUP BY folder_tree.root_id
        """,
        user_id,
        folder_ids,
    )
    return {row["root_id"]: int(row["byte_size"]) for row in rows}


async def list_folder_breadcrumbs(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    folder_id: UUID,
) -> list[asyncpg.Record]:
    """Return ancestor folders from root to the given folder."""
    return await conn.fetch(
        f"""
        WITH RECURSIVE ancestors AS (
            SELECT {_FOLDER_COLUMNS}, 0 AS depth
            FROM {MEDIA_FOLDERS}
            WHERE id = $2 AND user_id = $1 AND deleted_at IS NULL
            UNION ALL
            SELECT
                f.id, f.user_id, f.parent_folder_id, f.name, f.sort_order,
                f.created_at, f.updated_at,
                a.depth + 1
            FROM {MEDIA_FOLDERS} f
            INNER JOIN ancestors a ON f.id = a.parent_folder_id
            WHERE f.user_id = $1 AND f.deleted_at IS NULL
        )
        SELECT id, user_id, parent_folder_id, name, sort_order, created_at, updated_at
        FROM ancestors
        ORDER BY depth DESC
        """,
        user_id,
        folder_id,
    )


async def get_media_folder_parent_id(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    folder_id: UUID,
) -> UUID | None:
    """Return the parent folder id for one folder."""
    return await conn.fetchval(
        f"""
        SELECT parent_folder_id
        FROM {MEDIA_FOLDERS}
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        """,
        folder_id,
        user_id,
    )


async def count_child_folders(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    folder_id: UUID,
) -> int:
    """Count direct child folders."""
    return int(
        await conn.fetchval(
            f"""
            SELECT COUNT(*)
            FROM {MEDIA_FOLDERS}
            WHERE user_id = $1 AND parent_folder_id = $2 AND deleted_at IS NULL
            """,
            user_id,
            folder_id,
        )
        or 0
    )


async def update_media_folder_name(
    conn: asyncpg.Connection,
    *,
    folder_id: UUID,
    name: str,
) -> asyncpg.Record | None:
    """Rename a folder."""
    return await conn.fetchrow(
        f"""
        UPDATE {MEDIA_FOLDERS}
        SET name = $2, updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING {_FOLDER_COLUMNS}
        """,
        folder_id,
        name,
    )


async def update_media_folder_parent(
    conn: asyncpg.Connection,
    *,
    folder_id: UUID,
    parent_folder_id: UUID | None,
) -> asyncpg.Record | None:
    """Move a folder under a new parent or to the root."""
    return await conn.fetchrow(
        f"""
        UPDATE {MEDIA_FOLDERS}
        SET parent_folder_id = $2, updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING {_FOLDER_COLUMNS}
        """,
        folder_id,
        parent_folder_id,
    )


async def soft_delete_media_folder(
    conn: asyncpg.Connection,
    *,
    folder_id: UUID,
) -> asyncpg.Record | None:
    """Soft-delete one folder."""
    return await conn.fetchrow(
        f"""
        UPDATE {MEDIA_FOLDERS}
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING {_FOLDER_COLUMNS}
        """,
        folder_id,
    )


async def hard_delete_media_folder(
    conn: asyncpg.Connection,
    *,
    folder_id: UUID,
    user_id: int,
) -> bool:
    """Hard-delete one folder row."""
    result = await conn.execute(
        f"""
        DELETE FROM {MEDIA_FOLDERS}
        WHERE id = $1 AND user_id = $2
        """,
        folder_id,
        user_id,
    )
    return result.endswith("1")




# ----- Media attachments
async def insert_attachment(
    conn: asyncpg.Connection,
    *,
    media_id: UUID,
    entity_type: str,
    entity_id: int,
    role: str,
    sort_order: int = 0,
    display_name: str | None = None,
    project_folder_id: UUID | None = None,
) -> asyncpg.Record:
    """Insert one media attachment row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {MEDIA_ATTACHMENTS} (
            media_id, entity_type, entity_id, role, sort_order, display_name,
            project_folder_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING {_ATTACHMENT_COLUMNS}
        """,
        media_id,
        entity_type,
        entity_id,
        role,
        sort_order,
        display_name,
        project_folder_id,
    )
    if row is None:
        raise RuntimeError("Failed to insert media attachment.")
    return row


async def get_attachment(
    conn: asyncpg.Connection,
    attachment_id: int,
) -> asyncpg.Record | None:
    """Fetch one attachment by id."""
    return await conn.fetchrow(
        f"""
        SELECT {_ATTACHMENT_COLUMNS}
        FROM {MEDIA_ATTACHMENTS}
        WHERE id = $1
        """,
        attachment_id,
    )


async def list_attachments_for_entity(
    conn: asyncpg.Connection,
    *,
    entity_type: str,
    entity_id: int,
) -> list[asyncpg.Record]:
    """List attachments for one entity."""
    return await conn.fetch(
        f"""
        SELECT {_ATTACHMENT_COLUMNS}
        FROM {MEDIA_ATTACHMENTS}
        WHERE entity_type = $1 AND entity_id = $2
        ORDER BY sort_order ASC, id ASC
        """,
        entity_type,
        entity_id,
    )


async def list_attachments_for_media(
    conn: asyncpg.Connection,
    *,
    media_id: UUID,
) -> list[asyncpg.Record]:
    """List attachments referencing one media object."""
    return await conn.fetch(
        f"""
        SELECT {_ATTACHMENT_COLUMNS}
        FROM {MEDIA_ATTACHMENTS}
        WHERE media_id = $1
        ORDER BY entity_type ASC, entity_id ASC, sort_order ASC, id ASC
        """,
        media_id,
    )


async def list_attachments_for_entity_role(
    conn: asyncpg.Connection,
    *,
    entity_type: str,
    entity_id: int,
    role: str,
) -> list[asyncpg.Record]:
    """List attachments for one entity and role."""
    return await conn.fetch(
        f"""
        SELECT {_ATTACHMENT_COLUMNS}
        FROM {MEDIA_ATTACHMENTS}
        WHERE entity_type = $1 AND entity_id = $2 AND role = $3
        ORDER BY sort_order ASC, id ASC
        """,
        entity_type,
        entity_id,
        role,
    )


async def delete_attachment(
    conn: asyncpg.Connection,
    *,
    attachment_id: int,
) -> asyncpg.Record | None:
    """Delete one attachment row."""
    return await conn.fetchrow(
        f"""
        DELETE FROM {MEDIA_ATTACHMENTS}
        WHERE id = $1
        RETURNING {_ATTACHMENT_COLUMNS}
        """,
        attachment_id,
    )


async def delete_attachments_for_entity_role(
    conn: asyncpg.Connection,
    *,
    entity_type: str,
    entity_id: int,
    role: str,
) -> list[asyncpg.Record]:
    """Delete all attachments for an entity role."""
    return await conn.fetch(
        f"""
        DELETE FROM {MEDIA_ATTACHMENTS}
        WHERE entity_type = $1 AND entity_id = $2 AND role = $3
        RETURNING {_ATTACHMENT_COLUMNS}
        """,
        entity_type,
        entity_id,
        role,
    )


async def update_attachment(
    conn: asyncpg.Connection,
    *,
    attachment_id: int,
    role: str | None,
    sort_order: int | None,
    display_name: str | None,
    project_folder_id: UUID | None | object = ...,
) -> asyncpg.Record | None:
    """Patch attachment metadata."""
    if project_folder_id is ...:
        return await conn.fetchrow(
            f"""
            UPDATE {MEDIA_ATTACHMENTS}
            SET
                role = COALESCE($2, role),
                sort_order = COALESCE($3, sort_order),
                display_name = COALESCE($4, display_name)
            WHERE id = $1
            RETURNING {_ATTACHMENT_COLUMNS}
            """,
            attachment_id,
            role,
            sort_order,
            display_name,
        )
    return await conn.fetchrow(
        f"""
        UPDATE {MEDIA_ATTACHMENTS}
        SET
            role = COALESCE($2, role),
            sort_order = COALESCE($3, sort_order),
            display_name = COALESCE($4, display_name),
            project_folder_id = $5
        WHERE id = $1
        RETURNING {_ATTACHMENT_COLUMNS}
        """,
        attachment_id,
        role,
        sort_order,
        display_name,
        project_folder_id,
    )




# ----- Media panels
_PANEL_COLUMNS = (
    "id, user_id, name, column_count, row_unit_px, sort_order, created_at, updated_at"
)

_PANEL_ITEM_COLUMNS = (
    "id, panel_id, media_id, grid_x, grid_y, col_span, row_span, "
    "preview_scale, preview_focal_x, preview_focal_y, border_color, "
    "created_at, updated_at"
)


async def insert_media_panel(
    conn: asyncpg.Connection,
    *,
    panel_id: UUID,
    user_id: int,
    name: str,
    column_count: int,
    row_unit_px: int,
) -> asyncpg.Record:
    """Insert one media panel row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {MEDIA_PANELS} (
            id, user_id, name, column_count, row_unit_px
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING {_PANEL_COLUMNS}
        """,
        panel_id,
        user_id,
        name,
        column_count,
        row_unit_px,
    )
    if row is None:
        raise RuntimeError("Failed to insert media panel.")
    return row


async def get_media_panel_for_user(
    conn: asyncpg.Connection,
    panel_id: UUID,
    user_id: int,
) -> asyncpg.Record | None:
    """Fetch one active panel owned by a user."""
    return await conn.fetchrow(
        f"""
        SELECT {_PANEL_COLUMNS}
        FROM {MEDIA_PANELS}
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        """,
        panel_id,
        user_id,
    )


async def list_media_panels_for_user(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List active panels for one user."""
    return await conn.fetch(
        f"""
        SELECT
            p.id,
            p.user_id,
            p.name,
            p.column_count,
            p.row_unit_px,
            p.sort_order,
            p.created_at,
            p.updated_at,
            COUNT(i.id)::int AS item_count,
            (
                SELECT i2.media_id
                FROM {MEDIA_PANEL_ITEMS} i2
                WHERE i2.panel_id = p.id
                ORDER BY i2.grid_y ASC, i2.grid_x ASC
                LIMIT 1
            ) AS preview_media_id
        FROM {MEDIA_PANELS} p
        LEFT JOIN {MEDIA_PANEL_ITEMS} i ON i.panel_id = p.id
        WHERE p.user_id = $1 AND p.deleted_at IS NULL
        GROUP BY p.id
        ORDER BY p.updated_at DESC, p.name ASC
        """,
        user_id,
    )


async def update_media_panel_name(
    conn: asyncpg.Connection,
    *,
    panel_id: UUID,
    name: str,
) -> asyncpg.Record | None:
    """Rename a panel."""
    return await conn.fetchrow(
        f"""
        UPDATE {MEDIA_PANELS}
        SET name = $2, updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING {_PANEL_COLUMNS}
        """,
        panel_id,
        name,
    )


async def touch_media_panel(
    conn: asyncpg.Connection,
    *,
    panel_id: UUID,
) -> None:
    """Bump panel updated_at."""
    await conn.execute(
        f"""
        UPDATE {MEDIA_PANELS}
        SET updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        """,
        panel_id,
    )


async def soft_delete_media_panel(
    conn: asyncpg.Connection,
    *,
    panel_id: UUID,
) -> asyncpg.Record | None:
    """Soft-delete a panel."""
    return await conn.fetchrow(
        f"""
        UPDATE {MEDIA_PANELS}
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING {_PANEL_COLUMNS}
        """,
        panel_id,
    )


async def hard_delete_media_panel(
    conn: asyncpg.Connection,
    *,
    panel_id: UUID,
    user_id: int,
) -> bool:
    """Hard-delete one panel row."""
    result = await conn.execute(
        f"""
        DELETE FROM {MEDIA_PANELS}
        WHERE id = $1 AND user_id = $2
        """,
        panel_id,
        user_id,
    )
    return result.endswith("1")


async def list_media_panel_items(
    conn: asyncpg.Connection,
    *,
    panel_id: UUID,
) -> list[asyncpg.Record]:
    """List all items on one panel."""
    return await conn.fetch(
        f"""
        SELECT {_PANEL_ITEM_COLUMNS}
        FROM {MEDIA_PANEL_ITEMS}
        WHERE panel_id = $1
        ORDER BY grid_y ASC, grid_x ASC
        """,
        panel_id,
    )


async def get_media_panel_item(
    conn: asyncpg.Connection,
    *,
    panel_id: UUID,
    item_id: UUID,
) -> asyncpg.Record | None:
    """Fetch one panel item."""
    return await conn.fetchrow(
        f"""
        SELECT {_PANEL_ITEM_COLUMNS}
        FROM {MEDIA_PANEL_ITEMS}
        WHERE panel_id = $1 AND id = $2
        """,
        panel_id,
        item_id,
    )


async def insert_media_panel_item(
    conn: asyncpg.Connection,
    *,
    item_id: UUID,
    panel_id: UUID,
    media_id: UUID,
    grid_x: int,
    grid_y: int,
    col_span: int,
    row_span: int,
) -> asyncpg.Record:
    """Insert one panel tile."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {MEDIA_PANEL_ITEMS} (
            id, panel_id, media_id, grid_x, grid_y, col_span, row_span
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING {_PANEL_ITEM_COLUMNS}
        """,
        item_id,
        panel_id,
        media_id,
        grid_x,
        grid_y,
        col_span,
        row_span,
    )
    if row is None:
        raise RuntimeError("Failed to insert media panel item.")
    return row


async def update_media_panel_item_layout(
    conn: asyncpg.Connection,
    *,
    item_id: UUID,
    grid_x: int,
    grid_y: int,
    col_span: int,
    row_span: int,
) -> asyncpg.Record | None:
    """Update one panel tile grid placement without changing preview framing."""
    return await conn.fetchrow(
        f"""
        UPDATE {MEDIA_PANEL_ITEMS}
        SET
            grid_x = $2,
            grid_y = $3,
            col_span = $4,
            row_span = $5,
            updated_at = NOW()
        WHERE id = $1
        RETURNING {_PANEL_ITEM_COLUMNS}
        """,
        item_id,
        grid_x,
        grid_y,
        col_span,
        row_span,
    )


async def update_media_panel_item(
    conn: asyncpg.Connection,
    *,
    item_id: UUID,
    grid_x: int,
    grid_y: int,
    col_span: int,
    row_span: int,
    preview_scale: float = 1.0,
    preview_focal_x: float = 0.5,
    preview_focal_y: float = 0.5,
    border_color: str | None = None,
) -> asyncpg.Record | None:
    """Update one panel tile placement, preview framing, and border color."""
    return await conn.fetchrow(
        f"""
        UPDATE {MEDIA_PANEL_ITEMS}
        SET
            grid_x = $2,
            grid_y = $3,
            col_span = $4,
            row_span = $5,
            preview_scale = $6,
            preview_focal_x = $7,
            preview_focal_y = $8,
            border_color = $9,
            updated_at = NOW()
        WHERE id = $1
        RETURNING {_PANEL_ITEM_COLUMNS}
        """,
        item_id,
        grid_x,
        grid_y,
        col_span,
        row_span,
        preview_scale,
        preview_focal_x,
        preview_focal_y,
        border_color,
    )


async def swap_media_panel_item_placements(
    conn: asyncpg.Connection,
    *,
    item_a_id: UUID,
    item_b_id: UUID,
) -> tuple[asyncpg.Record, asyncpg.Record]:
    """Exchange grid placement between two panel tiles."""
    row_a = await conn.fetchrow(
        f"""
        SELECT grid_x, grid_y, col_span, row_span
        FROM {MEDIA_PANEL_ITEMS}
        WHERE id = $1
        """,
        item_a_id,
    )
    row_b = await conn.fetchrow(
        f"""
        SELECT grid_x, grid_y, col_span, row_span
        FROM {MEDIA_PANEL_ITEMS}
        WHERE id = $1
        """,
        item_b_id,
    )
    if row_a is None or row_b is None:
        raise RuntimeError("Failed to load panel items for swap.")

    updated_a = await conn.fetchrow(
        f"""
        UPDATE {MEDIA_PANEL_ITEMS}
        SET
            grid_x = $2,
            grid_y = $3,
            col_span = $4,
            row_span = $5,
            updated_at = NOW()
        WHERE id = $1
        RETURNING {_PANEL_ITEM_COLUMNS}
        """,
        item_a_id,
        row_b["grid_x"],
        row_b["grid_y"],
        row_b["col_span"],
        row_b["row_span"],
    )
    updated_b = await conn.fetchrow(
        f"""
        UPDATE {MEDIA_PANEL_ITEMS}
        SET
            grid_x = $2,
            grid_y = $3,
            col_span = $4,
            row_span = $5,
            updated_at = NOW()
        WHERE id = $1
        RETURNING {_PANEL_ITEM_COLUMNS}
        """,
        item_b_id,
        row_a["grid_x"],
        row_a["grid_y"],
        row_a["col_span"],
        row_a["row_span"],
    )
    if updated_a is None or updated_b is None:
        raise RuntimeError("Failed to swap panel item placements.")
    return updated_a, updated_b


async def delete_media_panel_item(
    conn: asyncpg.Connection,
    *,
    item_id: UUID,
) -> asyncpg.Record | None:
    """Delete one panel tile."""
    return await conn.fetchrow(
        f"""
        DELETE FROM {MEDIA_PANEL_ITEMS}
        WHERE id = $1
        RETURNING {_PANEL_ITEM_COLUMNS}
        """,
        item_id,
    )


async def replace_media_panel_layout(
    conn: asyncpg.Connection,
    *,
    panel_id: UUID,
    placements: list[tuple[UUID, int, int, int, int]],
) -> list[asyncpg.Record]:
    """Batch-update tile placements for one panel."""
    updated: list[asyncpg.Record] = []
    for item_id, grid_x, grid_y, col_span, row_span in placements:
        row = await update_media_panel_item_layout(
            conn,
            item_id=item_id,
            grid_x=grid_x,
            grid_y=grid_y,
            col_span=col_span,
            row_span=row_span,
        )
        if row is None:
            raise RuntimeError("Failed to update panel layout item.")
        updated.append(row)
    await touch_media_panel(conn, panel_id=panel_id)
    return updated
