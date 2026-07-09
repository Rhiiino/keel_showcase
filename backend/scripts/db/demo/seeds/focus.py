# keel_showcase/backend/scripts/db/demo/seeds/focus.py

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import asyncpg

from core import tables

from context import DemoContext, fetch_or_insert, upsert_tag


async def _seed_focus_node(
    conn: asyncpg.Connection,
    ctx: DemoContext,
    key: str,
    *,
    parent_id: int | None,
    kind: str,
    title: str,
    notes: str,
    status: str,
    sort_order: int,
    color: str | None = None,
    reference_type: str | None = None,
    reference_id: int | None = None,
) -> int:
    reference_target_id = str(reference_id) if reference_id is not None else None
    node_id = await fetch_or_insert(
        conn,
        ctx,
        table_key=tables.FOCUS_NODES,
        select_sql=f"""
            SELECT id FROM {tables.FOCUS_NODES}
            WHERE user_id = $1
              AND parent_id IS NOT DISTINCT FROM $2
              AND kind = $3
              AND title = $4
            ORDER BY id LIMIT 1
        """,
        select_args=(ctx.user_id, parent_id, kind, title),
        insert_sql=f"""
            INSERT INTO {tables.FOCUS_NODES}
                (
                    user_id, parent_id, kind, sort_order, title, notes,
                    status, node_color_hex, reference_target_type, reference_target_id
                )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        """,
        insert_args=(
            ctx.user_id,
            parent_id,
            kind,
            sort_order,
            title,
            notes,
            status,
            color,
            reference_type,
            reference_target_id,
        ),
    )
    ctx.focus_nodes[key] = node_id
    return node_id


async def seed_focus(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    origin_id = await conn.fetchval(
        f"""
        SELECT id FROM {tables.FOCUS_NODES}
        WHERE user_id = $1 AND is_origin = TRUE
        LIMIT 1
        """,
        ctx.user_id,
    )
    if origin_id is None:
        origin_id = await conn.fetchval(
            f"""
            INSERT INTO {tables.FOCUS_NODES}
                (user_id, kind, sort_order, title, notes, status, is_origin, node_color_hex)
            VALUES ($1, 'list', 0, 'Demo Focus Origin', 'Demo origin for showcase visitors.', 'active', TRUE, '#8B5CF6')
            RETURNING id
            """,
            ctx.user_id,
        )
        ctx.stats.inserted_one(tables.FOCUS_NODES)
    else:
        ctx.stats.reused_one(tables.FOCUS_NODES)
    ctx.focus_nodes["origin"] = int(origin_id)

    work = await _seed_focus_node(
        conn,
        ctx,
        "work",
        parent_id=int(origin_id),
        kind="list",
        title="Demo: Work Sprint",
        notes="Demo list for active work.",
        status="active",
        sort_order=0,
        color="#8B5CF6",
    )
    life = await _seed_focus_node(
        conn,
        ctx,
        "life",
        parent_id=int(origin_id),
        kind="list",
        title="Demo: Life Admin",
        notes="Demo list for personal tasks.",
        status="active",
        sort_order=1,
        color="#06B6D4",
    )
    task = await _seed_focus_node(
        conn,
        ctx,
        "task",
        parent_id=work,
        kind="item",
        title="Demo: Draft launch checklist",
        notes="Try completing or timing this task.",
        status="active",
        sort_order=0,
    )
    await _seed_focus_node(
        conn,
        ctx,
        "completed",
        parent_id=work,
        kind="item",
        title="Demo: Review archived website notes",
        notes="Completed demo task.",
        status="completed",
        sort_order=1,
    )
    await _seed_focus_node(
        conn,
        ctx,
        "paused",
        parent_id=life,
        kind="item",
        title="Demo: Schedule summer trip items",
        notes="Paused demo task.",
        status="paused",
        sort_order=0,
    )
    await _seed_focus_node(
        conn,
        ctx,
        "project-record",
        parent_id=work,
        kind="record",
        title="Demo: Launch Dashboard Project",
        notes="Linked demo project record.",
        status="active",
        sort_order=2,
        reference_type="project",
        reference_id=ctx.projects["launch"],
    )
    await _seed_focus_node(
        conn,
        ctx,
        "finance-record",
        parent_id=life,
        kind="record",
        title="Demo: USB Microphone Purchase",
        notes="Linked demo finance purchase.",
        status="paused",
        sort_order=1,
        reference_type="finance_transaction",
        reference_id=ctx.finance_transactions["mic"],
    )
    await _seed_focus_node(
        conn,
        ctx,
        "contact-record",
        parent_id=life,
        kind="record",
        title="Demo: Casey Patel Contact",
        notes="Linked demo contact record.",
        status="active",
        sort_order=2,
        reference_type="contact",
        reference_id=ctx.contacts["casey"],
    )

    focus_tag = await upsert_tag(
        conn, ctx, table=tables.FOCUS_TAGS, user_id=ctx.user_id, name="Demo Focus", color="#8B5CF6"
    )
    await conn.execute(
        f"""
        INSERT INTO {tables.FOCUS_NODE_TAGS} (node_id, tag_id)
        VALUES ($1, $2), ($3, $2)
        ON CONFLICT (node_id, tag_id) DO NOTHING
        """,
        work,
        focus_tag,
        life,
    )

    started_at = datetime(ctx.today.year, ctx.today.month, ctx.today.day, 13, 0, tzinfo=timezone.utc) - timedelta(days=20)
    exists = await conn.fetchval(
        f"""
        SELECT id FROM {tables.FOCUS_NODE_TIME_ENTRIES}
        WHERE user_id = $1 AND node_id = $2 AND started_at = $3
        LIMIT 1
        """,
        ctx.user_id,
        task,
        started_at,
    )
    if exists is None:
        await conn.execute(
            f"""
            INSERT INTO {tables.FOCUS_NODE_TIME_ENTRIES}
                (
                    user_id, node_id, status, started_at, ended_at,
                    accumulated_paused_seconds, duration_seconds
                )
            VALUES ($1, $2, 'ended', $3, $4, 300, 2700)
            """,
            ctx.user_id,
            task,
            started_at,
            started_at + timedelta(minutes=45),
        )
        ctx.stats.inserted_one(tables.FOCUS_NODE_TIME_ENTRIES)
    else:
        ctx.stats.reused_one(tables.FOCUS_NODE_TIME_ENTRIES)
