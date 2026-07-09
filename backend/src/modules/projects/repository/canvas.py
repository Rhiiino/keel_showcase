# keel_api/src/modules/projects/repository/canvas.py

"""SQL access for per-project workspace canvas rows."""

from __future__ import annotations

import json

import asyncpg

from core.tables import PROJECT_CANVAS

_CANVAS_RETURNING = (
    "id AS canvas_id, project_id, user_id, name, sort_order, is_default, "
    "state, settings, created_at, updated_at"
)

_CANVAS_META_RETURNING = (
    "id AS canvas_id, project_id, user_id, name, sort_order, is_default, "
    "created_at, updated_at"
)



# ----- Canvas list and lookup
async def list_canvases_by_project_id(
    conn: asyncpg.Connection,
    project_id: int,
) -> list[asyncpg.Record]:
    """Fetch all canvas rows for a project, ordered for display."""
    return await conn.fetch(
        f"""
        SELECT {_CANVAS_META_RETURNING}
        FROM {PROJECT_CANVAS}
        WHERE project_id = $1
        ORDER BY sort_order ASC, id ASC
        """,
        project_id,
    )


async def count_canvases_by_project_id(
    conn: asyncpg.Connection,
    project_id: int,
) -> int:
    """Return how many canvases exist for a project."""
    value = await conn.fetchval(
        f"""
        SELECT COUNT(*)::int
        FROM {PROJECT_CANVAS}
        WHERE project_id = $1
        """,
        project_id,
    )
    return int(value or 0)


async def get_canvas_by_id(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    canvas_id: int,
) -> asyncpg.Record | None:
    """Fetch one canvas row scoped to a project."""
    return await conn.fetchrow(
        f"""
        SELECT {_CANVAS_RETURNING}
        FROM {PROJECT_CANVAS}
        WHERE project_id = $1 AND id = $2
        """,
        project_id,
        canvas_id,
    )


async def get_default_canvas_by_project_id(
    conn: asyncpg.Connection,
    project_id: int,
) -> asyncpg.Record | None:
    """Fetch the default canvas row for a project."""
    return await conn.fetchrow(
        f"""
        SELECT {_CANVAS_RETURNING}
        FROM {PROJECT_CANVAS}
        WHERE project_id = $1 AND is_default = true
        ORDER BY id ASC
        LIMIT 1
        """,
        project_id,
    )


async def get_max_sort_order(
    conn: asyncpg.Connection,
    project_id: int,
) -> int:
    """Return the highest sort_order for canvases in a project."""
    value = await conn.fetchval(
        f"""
        SELECT COALESCE(MAX(sort_order), -1)::int
        FROM {PROJECT_CANVAS}
        WHERE project_id = $1
        """,
        project_id,
    )
    return int(value if value is not None else -1)



# ----- Canvas CRUD
async def create_canvas(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    user_id: int,
    name: str,
    sort_order: int,
    is_default: bool,
    state: dict | None = None,
) -> asyncpg.Record:
    """Insert a new canvas row for a project."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {PROJECT_CANVAS}
            (project_id, user_id, name, sort_order, is_default, state)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        RETURNING {_CANVAS_RETURNING}
        """,
        project_id,
        user_id,
        name,
        sort_order,
        is_default,
        json.dumps(state or {}),
    )
    if row is None:
        raise RuntimeError("Failed to create project canvas.")
    return row


async def update_canvas(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    canvas_id: int,
    name: str | None = None,
    sort_order: int | None = None,
    is_default: bool | None = None,
) -> asyncpg.Record | None:
    """Patch canvas metadata fields that were provided."""
    sets: list[str] = ["updated_at = NOW()"]
    args: list[object] = [project_id, canvas_id]
    arg_index = 3

    if name is not None:
        sets.append(f"name = ${arg_index}")
        args.append(name)
        arg_index += 1
    if sort_order is not None:
        sets.append(f"sort_order = ${arg_index}")
        args.append(sort_order)
        arg_index += 1
    if is_default is not None:
        sets.append(f"is_default = ${arg_index}")
        args.append(is_default)
        arg_index += 1

    if len(sets) == 1:
        return await get_canvas_by_id(conn, project_id=project_id, canvas_id=canvas_id)

    return await conn.fetchrow(
        f"""
        UPDATE {PROJECT_CANVAS}
        SET {", ".join(sets)}
        WHERE project_id = $1 AND id = $2
        RETURNING {_CANVAS_RETURNING}
        """,
        *args,
    )


async def clear_default_canvas(
    conn: asyncpg.Connection,
    project_id: int,
    *,
    except_canvas_id: int | None = None,
) -> None:
    """Unset is_default for all canvases in a project, optionally keeping one."""
    if except_canvas_id is None:
        await conn.execute(
            f"""
            UPDATE {PROJECT_CANVAS}
            SET is_default = false, updated_at = NOW()
            WHERE project_id = $1 AND is_default = true
            """,
            project_id,
        )
        return

    await conn.execute(
        f"""
        UPDATE {PROJECT_CANVAS}
        SET is_default = false, updated_at = NOW()
        WHERE project_id = $1 AND is_default = true AND id <> $2
        """,
        project_id,
        except_canvas_id,
    )


async def delete_canvas(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    canvas_id: int,
) -> bool:
    """Delete one canvas row. Returns True when a row was removed."""
    result = await conn.execute(
        f"""
        DELETE FROM {PROJECT_CANVAS}
        WHERE project_id = $1 AND id = $2
        """,
        project_id,
        canvas_id,
    )
    return result.endswith("1")



# ----- Canvas state and settings
async def update_canvas_state(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    canvas_id: int,
    state: dict,
) -> asyncpg.Record:
    """Replace the canvas state JSON for one canvas row."""
    row = await conn.fetchrow(
        f"""
        UPDATE {PROJECT_CANVAS}
        SET
            state = $3::jsonb,
            updated_at = NOW()
        WHERE project_id = $1 AND id = $2
        RETURNING {_CANVAS_RETURNING}
        """,
        project_id,
        canvas_id,
        json.dumps(state),
    )
    if row is None:
        raise RuntimeError("Failed to update project canvas state.")
    return row


async def update_canvas_settings(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    canvas_id: int,
    settings: dict,
) -> asyncpg.Record:
    """Replace the canvas settings JSON for one canvas row."""
    row = await conn.fetchrow(
        f"""
        UPDATE {PROJECT_CANVAS}
        SET
            settings = $3::jsonb,
            updated_at = NOW()
        WHERE project_id = $1 AND id = $2
        RETURNING {_CANVAS_RETURNING}
        """,
        project_id,
        canvas_id,
        json.dumps(settings),
    )
    if row is None:
        raise RuntimeError("Failed to update project canvas settings.")
    return row


async def upsert_canvas_settings_with_default_state(
    conn: asyncpg.Connection,
    *,
    project_id: int,
    canvas_id: int,
    user_id: int,
    settings: dict,
    default_state: dict,
) -> asyncpg.Record:
    """Update settings, inserting the canvas row when missing (legacy safety)."""
    row = await conn.fetchrow(
        f"""
        UPDATE {PROJECT_CANVAS}
        SET
            settings = $3::jsonb,
            updated_at = NOW()
        WHERE project_id = $1 AND id = $2
        RETURNING {_CANVAS_RETURNING}
        """,
        project_id,
        canvas_id,
        json.dumps(settings),
    )
    if row is not None:
        return row

    row = await conn.fetchrow(
        f"""
        INSERT INTO {PROJECT_CANVAS}
            (project_id, user_id, name, sort_order, is_default, state, settings)
        VALUES ($1, $2, 'Main', 0, true, $3::jsonb, $4::jsonb)
        RETURNING {_CANVAS_RETURNING}
        """,
        project_id,
        user_id,
        json.dumps(default_state),
        json.dumps(settings),
    )
    if row is None:
        raise RuntimeError("Failed to upsert project canvas settings.")
    return row
