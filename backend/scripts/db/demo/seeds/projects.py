# keel_showcase/backend/scripts/db/demo/seeds/projects.py

from __future__ import annotations

import asyncpg

from core import tables

from context import DemoContext, fetch_or_insert, upsert_tag


async def _seed_project(
    conn: asyncpg.Connection,
    ctx: DemoContext,
    key: str,
    title: str,
    description: str,
    status: str,
    kind: str,
    color: str,
    font: str,
) -> int:
    project_id = await fetch_or_insert(
        conn,
        ctx,
        table_key=tables.PROJECTS,
        select_sql=f"""
            SELECT id FROM {tables.PROJECTS}
            WHERE user_id = $1 AND title = $2
            ORDER BY id LIMIT 1
        """,
        select_args=(ctx.user_id, title),
        insert_sql=f"""
            INSERT INTO {tables.PROJECTS}
                (
                    user_id, title, description, status, kind,
                    cover_glow_color_hex, cover_model_color_hex,
                    kanban_card_color_hex, title_font_key
                )
            VALUES ($1, $2, $3, $4, $5, $6, $6, $6, $7)
            RETURNING id
        """,
        insert_args=(ctx.user_id, title, description, status, kind, color, font),
    )
    await conn.execute(
        f"""
        INSERT INTO {tables.PROJECT_CANVAS}
            (project_id, user_id, name, sort_order, is_default, state)
        SELECT $1, $2, 'Main', 0, true, $3::jsonb
        WHERE NOT EXISTS (
            SELECT 1 FROM {tables.PROJECT_CANVAS} WHERE project_id = $1
        )
        """,
        project_id,
        ctx.user_id,
        '{"nodes":[],"edges":[],"viewport":{"x":0,"y":0,"zoom":1}}',
    )
    ctx.projects[key] = project_id
    return project_id


async def seed_projects(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    planning = await upsert_tag(
        conn, ctx, table=tables.PROJECT_TAGS, user_id=ctx.user_id, name="Demo Planning", color="#8B5CF6"
    )
    build = await upsert_tag(
        conn, ctx, table=tables.PROJECT_TAGS, user_id=ctx.user_id, name="Demo Build", color="#06B6D4"
    )
    life = await upsert_tag(
        conn, ctx, table=tables.PROJECT_TAGS, user_id=ctx.user_id, name="Demo Life", color="#F97316"
    )
    specs = (
        (
            "launch",
            "Demo: Launch Dashboard",
            "Sample active product project for the showcase kanban.",
            "active",
            "software",
            "#8B5CF6",
            "tech",
            (planning, build),
        ),
        (
            "studio",
            "Demo: Home Studio Refresh",
            "Sample personal planning project.",
            "planning",
            "personal",
            "#06B6D4",
            "rounded",
            (planning, life),
        ),
        (
            "archive",
            "Demo: Archived Website Cleanup",
            "Completed sample project for archive UI checks.",
            "archived",
            "software",
            "#64748B",
            "mono",
            (build,),
        ),
    )
    for key, title, description, status, kind, color, font, tags_for_project in specs:
        project_id = await _seed_project(conn, ctx, key, title, description, status, kind, color, font)
        for tag_id in tags_for_project:
            await conn.execute(
                f"""
                INSERT INTO {tables.PROJECT_TAG_ASSIGNMENTS} (project_id, tag_id)
                VALUES ($1, $2)
                ON CONFLICT (project_id, tag_id) DO NOTHING
                """,
                project_id,
                tag_id,
            )
