# keel_api/src/modules/projects/repository/projects.py

"""SQL access for personal projects."""

from __future__ import annotations

import asyncpg

from core.tables import PROJECTS

_PROJECT_COLUMNS = (
    "p.id, p.user_id, p.title, p.description, p.status, p.kind, "
    "p.cover_glow_color_hex, p.cover_model_color_hex, p.cover_model_brightness, "
    "p.cover_image_scale, p.cover_image_position_x, p.cover_image_position_y, "
    "p.kanban_card_color_hex, "
    "p.title_font_key, p.created_at, p.updated_at"
)

_PROJECT_RETURNING = (
    "id, user_id, title, description, status, kind, "
    "cover_glow_color_hex, cover_model_color_hex, cover_model_brightness, "
    "cover_image_scale, cover_image_position_x, cover_image_position_y, "
    "kanban_card_color_hex, "
    "title_font_key, created_at, updated_at"
)

_PROJECT_FROM = f"FROM {PROJECTS} p"



# ----- Projects table operations
async def list_projects(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List project rows for a user, newest first."""
    return await conn.fetch(
        f"""
        SELECT {_PROJECT_COLUMNS}
        {_PROJECT_FROM}
        WHERE p.user_id = $1
        ORDER BY p.updated_at DESC, p.id DESC
        """,
        user_id,
    )


async def get_project(
    conn: asyncpg.Connection,
    project_id: int,
) -> asyncpg.Record | None:
    """Fetch one project row by id."""
    return await conn.fetchrow(
        f"""
        SELECT {_PROJECT_COLUMNS}
        {_PROJECT_FROM}
        WHERE p.id = $1
        """,
        project_id,
    )


async def insert_project(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    title: str,
    description: str,
    status: str,
    kind: str | None,
) -> asyncpg.Record:
    """Insert a new project row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {PROJECTS} (
            user_id, title, description, status, kind
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING {_PROJECT_RETURNING}
        """,
        user_id,
        title,
        description,
        status,
        kind,
    )
    if row is None:
        raise RuntimeError("Failed to insert project.")
    return row


async def update_project(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    title: str,
    description: str,
    status: str,
    kind: str | None,
    cover_glow_color_hex: str | None,
    cover_model_color_hex: str | None,
    cover_model_brightness: float,
    cover_image_scale: float,
    cover_image_position_x: float,
    cover_image_position_y: float,
    kanban_card_color_hex: str | None,
    title_font_key: str | None,
) -> asyncpg.Record | None:
    """Update project metadata columns."""
    return await conn.fetchrow(
        f"""
        UPDATE {PROJECTS}
        SET
            title = $2,
            description = $3,
            status = $4,
            kind = $5,
            cover_glow_color_hex = $6,
            cover_model_color_hex = $7,
            cover_model_brightness = $8,
            cover_image_scale = $9,
            cover_image_position_x = $10,
            cover_image_position_y = $11,
            kanban_card_color_hex = $12,
            title_font_key = $13,
            updated_at = NOW()
        WHERE id = $1
        RETURNING {_PROJECT_RETURNING}
        """,
        project_id,
        title,
        description,
        status,
        kind,
        cover_glow_color_hex,
        cover_model_color_hex,
        cover_model_brightness,
        cover_image_scale,
        cover_image_position_x,
        cover_image_position_y,
        kanban_card_color_hex,
        title_font_key,
    )


async def delete_project(
    conn: asyncpg.Connection,
    *,
    project_id: int,
) -> bool:
    """Delete a project row."""
    result = await conn.execute(
        f"DELETE FROM {PROJECTS} WHERE id = $1",
        project_id,
    )
    return result.endswith("1")
