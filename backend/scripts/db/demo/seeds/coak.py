# keel_showcase/backend/scripts/db/demo/seeds/coak.py

from __future__ import annotations

import asyncpg

from core import tables

from context import DemoContext, fetch_or_insert


async def _seed_coak_tag(
    conn: asyncpg.Connection,
    ctx: DemoContext,
    record_id: int,
    name: str,
    color: str,
) -> int:
    row = await conn.fetchrow(
        f"""
        INSERT INTO {tables.COAK_TAGS}
            (coak_record_id, user_id, name, color_hex)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (coak_record_id, name) DO UPDATE
        SET color_hex = EXCLUDED.color_hex
        RETURNING id, (xmax = 0) AS inserted
        """,
        record_id,
        ctx.user_id,
        name,
        color,
    )
    if row["inserted"]:
        ctx.stats.inserted_one(tables.COAK_TAGS)
    else:
        ctx.stats.reused_one(tables.COAK_TAGS)
    return int(row["id"])


async def _seed_coak_item(
    conn: asyncpg.Connection,
    ctx: DemoContext,
    record_id: int,
    key: str,
    *,
    parent_id: int | None,
    kind: str,
    name: str,
    sort_order: int,
    note_body: str = "",
    flash_front: str = "",
    flash_back: str = "",
) -> int:
    item_id = await fetch_or_insert(
        conn,
        ctx,
        table_key=tables.COAK_ITEMS,
        select_sql=f"""
            SELECT id FROM {tables.COAK_ITEMS}
            WHERE coak_record_id = $1 AND parent_id IS NOT DISTINCT FROM $2 AND name = $3
            ORDER BY id LIMIT 1
        """,
        select_args=(record_id, parent_id, name),
        insert_sql=f"""
            INSERT INTO {tables.COAK_ITEMS}
                (
                    coak_record_id, user_id, parent_id, kind, name, sort_order,
                    note_body, flash_front, flash_back
                )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        """,
        insert_args=(
            record_id,
            ctx.user_id,
            parent_id,
            kind,
            name,
            sort_order,
            note_body,
            flash_front,
            flash_back,
        ),
    )
    ctx.coak_items[key] = item_id
    return item_id


async def seed_coak(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    record_id = await fetch_or_insert(
        conn,
        ctx,
        table_key=tables.COAK_RECORDS,
        select_sql=f"""
            SELECT id FROM {tables.COAK_RECORDS}
            WHERE user_id = $1 AND name = 'Demo: Product Ideas'
            ORDER BY id LIMIT 1
        """,
        select_args=(ctx.user_id,),
        insert_sql=f"""
            INSERT INTO {tables.COAK_RECORDS}
                (user_id, name, color_hex)
            VALUES ($1, 'Demo: Product Ideas', '#8B5CF6')
            RETURNING id
        """,
        insert_args=(ctx.user_id,),
    )
    ctx.coak_records["ideas"] = record_id

    arch_folder = await _seed_coak_item(
        conn,
        ctx,
        record_id,
        "arch_folder",
        parent_id=None,
        kind="folder",
        name="Architecture",
        sort_order=0,
    )
    inspiration_folder = await _seed_coak_item(
        conn,
        ctx,
        record_id,
        "inspiration_folder",
        parent_id=None,
        kind="folder",
        name="Inspiration",
        sort_order=1,
    )
    monolith_note = await _seed_coak_item(
        conn,
        ctx,
        record_id,
        "monolith_note",
        parent_id=arch_folder,
        kind="note",
        name="Demo: Modular monolith boundaries",
        sort_order=0,
        note_body="Keep feature modules isolated behind manifest registries and shared core utilities.",
    )
    sse_note = await _seed_coak_item(
        conn,
        ctx,
        record_id,
        "sse_note",
        parent_id=arch_folder,
        kind="note",
        name="Demo: SSE chat flow",
        sort_order=1,
        note_body="User message persists first, then the Keel orchestrator streams tool calls and assistant output.",
    )
    agent_flash = await _seed_coak_item(
        conn,
        ctx,
        record_id,
        "agent_flash",
        parent_id=arch_folder,
        kind="flash",
        name="Showcase chat agent",
        sort_order=2,
        flash_front="What agent drives showcase chat?",
        flash_back="Keel orchestrator",
    )
    login_flash = await _seed_coak_item(
        conn,
        ctx,
        record_id,
        "login_flash",
        parent_id=arch_folder,
        kind="flash",
        name="Showcase login",
        sort_order=3,
        flash_front="Showcase login method?",
        flash_back="Enter button, shared demo user",
    )
    inspiration_note = await _seed_coak_item(
        conn,
        ctx,
        record_id,
        "inspiration_note",
        parent_id=inspiration_folder,
        kind="note",
        name="Demo: Visitor-first onboarding",
        sort_order=0,
        note_body="Seed realistic demo data so every module looks alive on first visit.",
    )

    ideas_tag = await _seed_coak_tag(conn, ctx, record_id, "Ideas", "#8B5CF6")
    reference_tag = await _seed_coak_tag(conn, ctx, record_id, "Reference", "#06B6D4")
    for item_id in (monolith_note, sse_note, agent_flash, login_flash, inspiration_note):
        await conn.execute(
            f"""
            INSERT INTO {tables.COAK_ITEM_TAG_ASSIGNMENTS}
                (coak_item_id, coak_record_id, tag_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (coak_item_id, tag_id) DO NOTHING
            """,
            item_id,
            record_id,
            ideas_tag,
        )
    await conn.execute(
        f"""
        INSERT INTO {tables.COAK_ITEM_TAG_ASSIGNMENTS}
            (coak_item_id, coak_record_id, tag_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (coak_item_id, tag_id) DO NOTHING
        """,
        sse_note,
        record_id,
        reference_tag,
    )
