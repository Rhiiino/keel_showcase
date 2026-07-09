# keel_showcase/backend/scripts/db/demo/seeds/preferences.py

from __future__ import annotations

import asyncpg

from core import tables

from context import DemoContext


async def seed_user_preferences(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    result = await conn.execute(
        f"""
        INSERT INTO {tables.USER_PREFERENCES} (user_id, data)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (user_id) DO NOTHING
        """,
        ctx.user_id,
        '{"theme":"dark","nav_panel":{"is_open":true},"nav_menu_layout":[]}',
    )
    if result.endswith("1"):
        ctx.stats.inserted_one(tables.USER_PREFERENCES)
    else:
        ctx.stats.reused_one(tables.USER_PREFERENCES)
