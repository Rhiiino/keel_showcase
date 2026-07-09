# keel_showcase/backend/scripts/db/demo/seeds/services.py

from __future__ import annotations

import asyncpg

from core import tables

from context import DemoContext, fetch_or_insert


async def seed_services(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    specs = (
        (
            "frontend",
            "Keel Showcase Frontend",
            "https://keel.themidhunraj.com",
            "frontend",
            "Public showcase web app.",
        ),
        (
            "api",
            "Keel Showcase API",
            "https://keelapi.themidhunraj.com/docs",
            "backend",
            "FastAPI backend and OpenAPI docs.",
        ),
        (
            "github",
            "GitHub Status",
            "https://www.githubstatus.com",
            "frontend",
            "External status page for comparison.",
        ),
    )
    for key, name, url, service_type, description in specs:
        await fetch_or_insert(
            conn,
            ctx,
            table_key=tables.SERVICES,
            select_sql=f"""
                SELECT id FROM {tables.SERVICES}
                WHERE user_id = $1 AND service_name = $2 AND service_type = $3
                ORDER BY id LIMIT 1
            """,
            select_args=(ctx.user_id, name, service_type),
            insert_sql=f"""
                INSERT INTO {tables.SERVICES}
                    (user_id, service_name, url, service_type, description, check_enabled)
                VALUES ($1, $2, $3, $4, $5, TRUE)
                RETURNING id
            """,
            insert_args=(ctx.user_id, name, url, service_type, description),
        )
