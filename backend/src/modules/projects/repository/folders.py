# keel_api/src/modules/projects/repository/folders.py

"""SQL access for project-scoped file folders."""

from __future__ import annotations

from uuid import UUID

import asyncpg

from core.tables import MEDIA_ATTACHMENTS, PROJECT_FOLDERS

_FOLDER_COLUMNS = (
    "id, project_id, user_id, parent_folder_id, name, sort_order, created_at, updated_at"
)



# ----- Project folders table operations
async def insert_project_folder(
    conn: asyncpg.Connection,
    *,
    folder_id: UUID,
    project_id: int,
    user_id: int,
    name: str,
    parent_folder_id: UUID | None = None,
    sort_order: int = 0,
) -> asyncpg.Record:
    """Insert one project folder row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {PROJECT_FOLDERS} (
            id, project_id, user_id, parent_folder_id, name, sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING {_FOLDER_COLUMNS}
        """,
        folder_id,
        project_id,
        user_id,
        parent_folder_id,
        name,
        sort_order,
    )
    if row is None:
        raise RuntimeError("Failed to insert project folder.")
    return row


async def get_project_folder(
    conn: asyncpg.Connection,
    *,
    folder_id: UUID,
    project_id: int,
) -> asyncpg.Record | None:
    """Fetch one non-deleted folder for a project."""
    return await conn.fetchrow(
        f"""
        SELECT {_FOLDER_COLUMNS}
        FROM {PROJECT_FOLDERS}
        WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL
        """,
        folder_id,
        project_id,
    )


async def list_project_folders_for_project(
    conn: asyncpg.Connection,
    project_id: int,
) -> list[asyncpg.Record]:
    """List all non-deleted folders for one project."""
    return await conn.fetch(
        f"""
        SELECT {_FOLDER_COLUMNS}
        FROM {PROJECT_FOLDERS}
        WHERE project_id = $1 AND deleted_at IS NULL
        ORDER BY sort_order ASC, lower(name) ASC, id ASC
        """,
        project_id,
    )


async def list_project_folders_for_parent(
    conn: asyncpg.Connection,
    project_id: int,
    *,
    parent_folder_id: UUID | None = None,
) -> list[asyncpg.Record]:
    """List child folders at one parent scope within a project."""
    if parent_folder_id is None:
        return await conn.fetch(
            f"""
            SELECT {_FOLDER_COLUMNS}
            FROM {PROJECT_FOLDERS}
            WHERE project_id = $1 AND parent_folder_id IS NULL AND deleted_at IS NULL
            ORDER BY sort_order ASC, lower(name) ASC, id ASC
            """,
            project_id,
        )
    return await conn.fetch(
        f"""
        SELECT {_FOLDER_COLUMNS}
        FROM {PROJECT_FOLDERS}
        WHERE project_id = $1 AND parent_folder_id = $2 AND deleted_at IS NULL
        ORDER BY sort_order ASC, lower(name) ASC, id ASC
        """,
        project_id,
        parent_folder_id,
    )


async def list_project_folder_breadcrumbs(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    folder_id: UUID,
) -> list[asyncpg.Record]:
    """Return ancestor folders from root to the given folder."""
    return await conn.fetch(
        f"""
        WITH RECURSIVE ancestors AS (
            SELECT {_FOLDER_COLUMNS}, 0 AS depth
            FROM {PROJECT_FOLDERS}
            WHERE id = $2 AND project_id = $1 AND deleted_at IS NULL
            UNION ALL
            SELECT
                f.id, f.project_id, f.user_id, f.parent_folder_id, f.name,
                f.sort_order, f.created_at, f.updated_at,
                a.depth + 1
            FROM {PROJECT_FOLDERS} f
            INNER JOIN ancestors a ON f.id = a.parent_folder_id
            WHERE f.project_id = $1 AND f.deleted_at IS NULL
        )
        SELECT id, project_id, user_id, parent_folder_id, name, sort_order, created_at, updated_at
        FROM ancestors
        ORDER BY depth DESC
        """,
        project_id,
        folder_id,
    )


async def get_project_folder_parent_id(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    folder_id: UUID,
) -> UUID | None:
    """Return the parent folder id for one folder."""
    return await conn.fetchval(
        f"""
        SELECT parent_folder_id
        FROM {PROJECT_FOLDERS}
        WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL
        """,
        folder_id,
        project_id,
    )


async def count_child_project_folders(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    folder_id: UUID,
) -> int:
    """Count direct child folders."""
    value = await conn.fetchval(
        f"""
        SELECT COUNT(*)::int
        FROM {PROJECT_FOLDERS}
        WHERE project_id = $1 AND parent_folder_id = $2 AND deleted_at IS NULL
        """,
        project_id,
        folder_id,
    )
    return int(value or 0)


async def count_gallery_attachments_in_project_folder(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    folder_id: UUID,
) -> int:
    """Count gallery attachments placed in one project folder."""
    value = await conn.fetchval(
        f"""
        SELECT COUNT(*)::int
        FROM {MEDIA_ATTACHMENTS}
        WHERE entity_type = 'project'
          AND entity_id = $1
          AND role = 'gallery'
          AND project_folder_id = $2
        """,
        project_id,
        folder_id,
    )
    return int(value or 0)


async def update_project_folder_name(
    conn: asyncpg.Connection,
    *,
    folder_id: UUID,
    name: str,
) -> asyncpg.Record | None:
    """Rename one project folder."""
    return await conn.fetchrow(
        f"""
        UPDATE {PROJECT_FOLDERS}
        SET name = $2, updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING {_FOLDER_COLUMNS}
        """,
        folder_id,
        name,
    )


async def update_project_folder_parent(
    conn: asyncpg.Connection,
    *,
    folder_id: UUID,
    parent_folder_id: UUID | None,
) -> asyncpg.Record | None:
    """Move one project folder under a new parent."""
    return await conn.fetchrow(
        f"""
        UPDATE {PROJECT_FOLDERS}
        SET parent_folder_id = $2, updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING {_FOLDER_COLUMNS}
        """,
        folder_id,
        parent_folder_id,
    )


async def update_project_folder_sort_order(
    conn: asyncpg.Connection,
    *,
    folder_id: UUID,
    sort_order: int,
) -> asyncpg.Record | None:
    """Update folder sort order."""
    return await conn.fetchrow(
        f"""
        UPDATE {PROJECT_FOLDERS}
        SET sort_order = $2, updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING {_FOLDER_COLUMNS}
        """,
        folder_id,
        sort_order,
    )


async def soft_delete_project_folder(
    conn: asyncpg.Connection,
    *,
    folder_id: UUID,
) -> asyncpg.Record | None:
    """Soft-delete one project folder."""
    return await conn.fetchrow(
        f"""
        UPDATE {PROJECT_FOLDERS}
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING {_FOLDER_COLUMNS}
        """,
        folder_id,
    )


async def hard_delete_project_folder(
    conn: asyncpg.Connection,
    *,
    folder_id: UUID,
) -> bool:
    """Hard-delete one project folder row."""
    result = await conn.execute(
        f"""
        DELETE FROM {PROJECT_FOLDERS}
        WHERE id = $1
        """,
        folder_id,
    )
    return result.endswith("1")
