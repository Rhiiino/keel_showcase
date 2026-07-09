# keel_api/src/modules/projects/repository/tags.py

"""SQL access for project tags and project-tag assignments."""

from __future__ import annotations

import asyncpg

from core.tables import PROJECT_TAG_ASSIGNMENTS, PROJECT_TAGS, PROJECTS

_TAG_COLUMNS = "id, user_id, name, description, color_hex, created_at, updated_at"


async def list_user_tags(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List tag rows for a user."""
    return await conn.fetch(
        f"""
        SELECT
            t.id,
            t.user_id,
            t.name,
            t.description,
            t.color_hex,
            t.created_at,
            t.updated_at,
            COUNT(DISTINCT p.id)::int AS project_count
        FROM {PROJECT_TAGS} t
        LEFT JOIN {PROJECT_TAG_ASSIGNMENTS} pta ON pta.tag_id = t.id
        LEFT JOIN {PROJECTS} p
            ON p.id = pta.project_id
            AND p.user_id = t.user_id
        WHERE t.user_id = $1
        GROUP BY t.id, t.user_id, t.name, t.description, t.color_hex, t.created_at, t.updated_at
        ORDER BY t.name ASC, t.id ASC
        """,
        user_id,
    )


async def get_user_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_id: int,
) -> asyncpg.Record | None:
    """Fetch one tag row owned by a user."""
    return await conn.fetchrow(
        f"""
        SELECT {_TAG_COLUMNS}
        FROM {PROJECT_TAGS}
        WHERE id = $1 AND user_id = $2
        """,
        tag_id,
        user_id,
    )


async def insert_user_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    name: str,
    description: str | None,
    color_hex: str,
) -> asyncpg.Record:
    """Insert a new user tag row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {PROJECT_TAGS} (user_id, name, description, color_hex)
        VALUES ($1, $2, $3, $4)
        RETURNING {_TAG_COLUMNS}
        """,
        user_id,
        name,
        description,
        color_hex,
    )
    if row is None:
        raise RuntimeError("Failed to insert project tag.")
    return row


async def update_user_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_id: int,
    name: str,
    description: str | None,
    color_hex: str,
) -> asyncpg.Record | None:
    """Update one user tag row."""
    return await conn.fetchrow(
        f"""
        UPDATE {PROJECT_TAGS}
        SET
            name = $3,
            description = $4,
            color_hex = $5,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING {_TAG_COLUMNS}
        """,
        tag_id,
        user_id,
        name,
        description,
        color_hex,
    )


async def delete_user_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_id: int,
) -> bool:
    """Delete one user tag row."""
    result = await conn.execute(
        f"""
        DELETE FROM {PROJECT_TAGS}
        WHERE id = $1 AND user_id = $2
        """,
        tag_id,
        user_id,
    )
    return result.endswith("1")


async def fetch_tags_for_projects(
    conn: asyncpg.Connection,
    project_ids: list[int],
) -> dict[int, list[asyncpg.Record]]:
    """Load tags grouped by project id."""
    if not project_ids:
        return {}

    rows = await conn.fetch(
        f"""
        SELECT
            pta.project_id,
            t.id,
            t.name,
            t.description,
            t.color_hex
        FROM {PROJECT_TAG_ASSIGNMENTS} pta
        INNER JOIN {PROJECT_TAGS} t ON t.id = pta.tag_id
        WHERE pta.project_id = ANY($1::int[])
        ORDER BY t.name ASC, t.id ASC
        """,
        project_ids,
    )

    grouped: dict[int, list[asyncpg.Record]] = {project_id: [] for project_id in project_ids}
    for row in rows:
        grouped[row["project_id"]].append(row)
    return grouped


async def replace_project_tags(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    tag_ids: list[int],
) -> None:
    """Replace tag associations for a project."""
    await conn.execute(
        f"""
        DELETE FROM {PROJECT_TAG_ASSIGNMENTS}
        WHERE project_id = $1
        """,
        project_id,
    )

    if not tag_ids:
        return

    await conn.executemany(
        f"""
        INSERT INTO {PROJECT_TAG_ASSIGNMENTS} (project_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        """,
        [(project_id, tag_id) for tag_id in tag_ids],
    )


async def count_owned_tags(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_ids: list[int],
) -> int:
    """Count how many tag ids belong to a user."""
    if not tag_ids:
        return 0

    return await conn.fetchval(
        f"""
        SELECT COUNT(*)
        FROM {PROJECT_TAGS}
        WHERE user_id = $1 AND id = ANY($2::int[])
        """,
        user_id,
        tag_ids,
    )
