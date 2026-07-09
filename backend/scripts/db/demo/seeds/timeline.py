# keel_showcase/backend/scripts/db/demo/seeds/timeline.py

from __future__ import annotations

from datetime import date, timedelta

import asyncpg

from core import tables

from context import DemoContext, date_at_midnight, fetch_or_insert, upsert_tag


async def seed_timeline(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    today = ctx.today
    tag_specs = (
        ("Milestones", "#8B5CF6"),
        ("Travel", "#06B6D4"),
        ("Work", "#F97316"),
        ("Family", "#10B981"),
    )
    tags: dict[str, int] = {}
    for name, color in tag_specs:
        tags[name] = await upsert_tag(
            conn, ctx, table=tables.TIMELINE_TAGS, user_id=ctx.user_id, name=name, color=color
        )

    event_specs = (
        (
            "today_call",
            "Demo: Launch review call",
            "Review showcase modules before sharing the public link.",
            today,
            None,
            ("alex", "dana"),
            (),
            ("Work",),
            (("days", 1),),
        ),
        (
            "studio_move",
            "Demo: Home studio move-in",
            "Set up the refreshed studio workspace.",
            today - timedelta(days=45),
            None,
            ("alex", "morgan"),
            (),
            ("Family",),
            (),
        ),
        (
            "recital",
            "Demo: Jamie's school recital",
            "Family outing to support Jamie's performance.",
            today - timedelta(days=120),
            None,
            ("jamie", "morgan", "alex"),
            (),
            ("Family",),
            (),
        ),
        (
            "road_trip",
            "Demo: Summer road trip",
            "Weekend getaway with Morgan.",
            today + timedelta(days=30),
            today + timedelta(days=33),
            ("morgan",),
            (),
            ("Travel",),
            (),
        ),
        (
            "product_ship",
            "Demo: Product v1 shipped",
            "First public release milestone.",
            date(2024, 3, 15),
            None,
            (),
            ("hopper",),
            ("Milestones",),
            (),
        ),
    )

    for key, subject, description, start, end, contact_keys, figure_keys, tag_names, reminders in event_specs:
        start_dt = date_at_midnight(start)
        end_dt = date_at_midnight(end) if end else None
        event_id = await fetch_or_insert(
            conn,
            ctx,
            table_key=tables.TIMELINE_EVENTS,
            select_sql=f"""
                SELECT id FROM {tables.TIMELINE_EVENTS}
                WHERE user_id = $1 AND description = $2
                ORDER BY id LIMIT 1
            """,
            select_args=(ctx.user_id, description),
            insert_sql=f"""
                INSERT INTO {tables.TIMELINE_EVENTS}
                    (user_id, subject_name, description, start_date, end_date, all_day)
                VALUES ($1, $2, $3, $4, $5, TRUE)
                RETURNING id
            """,
            insert_args=(ctx.user_id, subject, description, start_dt, end_dt),
        )
        ctx.timeline_events[key] = event_id

        for contact_key in contact_keys:
            await conn.execute(
                f"""
                INSERT INTO {tables.TIMELINE_EVENT_CONTACTS} (timeline_event_id, contact_id)
                VALUES ($1, $2)
                ON CONFLICT (timeline_event_id, contact_id) DO NOTHING
                """,
                event_id,
                ctx.contacts[contact_key],
            )
        for figure_key in figure_keys:
            await conn.execute(
                f"""
                INSERT INTO {tables.TIMELINE_EVENT_FIGURES} (timeline_event_id, figure_id)
                VALUES ($1, $2)
                ON CONFLICT (timeline_event_id, figure_id) DO NOTHING
                """,
                event_id,
                ctx.figures[figure_key],
            )
        for tag_name in tag_names:
            exists = await conn.fetchval(
                f"""
                SELECT 1 FROM {tables.TIMELINE_TAG_ASSIGNMENTS}
                WHERE timeline_event_id = $1 AND tag_id = $2
                LIMIT 1
                """,
                event_id,
                tags[tag_name],
            )
            if exists is None:
                await conn.execute(
                    f"""
                    INSERT INTO {tables.TIMELINE_TAG_ASSIGNMENTS}
                        (tag_id, timeline_event_id)
                    VALUES ($1, $2)
                    """,
                    tags[tag_name],
                    event_id,
                )
                ctx.stats.inserted_one(tables.TIMELINE_TAG_ASSIGNMENTS)
        for unit, amount in reminders:
            exists = await conn.fetchval(
                f"""
                SELECT id FROM {tables.TIMELINE_EVENT_REMINDERS}
                WHERE timeline_event_id = $1 AND unit = $2 AND amount = $3
                LIMIT 1
                """,
                event_id,
                unit,
                amount,
            )
            if exists is None:
                await conn.execute(
                    f"""
                    INSERT INTO {tables.TIMELINE_EVENT_REMINDERS}
                        (timeline_event_id, amount, unit)
                    VALUES ($1, $2, $3)
                    """,
                    event_id,
                    amount,
                    unit,
                )
                ctx.stats.inserted_one(tables.TIMELINE_EVENT_REMINDERS)

    plan_start = today + timedelta(days=11)
    plan_end = today + timedelta(days=18)
    plan_id = await fetch_or_insert(
        conn,
        ctx,
        table_key=tables.TIMELINE_PLANS,
        select_sql=f"""
            SELECT id FROM {tables.TIMELINE_PLANS}
            WHERE user_id = $1 AND title = 'Demo: Summer Trip 2026'
            ORDER BY id LIMIT 1
        """,
        select_args=(ctx.user_id,),
        insert_sql=f"""
            INSERT INTO {tables.TIMELINE_PLANS}
                (user_id, title, start_date, end_date, notes)
            VALUES ($1, 'Demo: Summer Trip 2026', $2, $3, 'Demo forward planner for the showcase.')
            RETURNING id
        """,
        insert_args=(ctx.user_id, plan_start, plan_end),
    )

    plan_items = (
        ("Pack bags", plan_start, plan_start, 0),
        ("Drive to coast", plan_start + timedelta(days=1), plan_start + timedelta(days=1), 1),
        ("Hike day", plan_start + timedelta(days=3), plan_start + timedelta(days=3), 2),
        ("Return home", plan_end, plan_end, 3),
    )
    for title, start, end, sort_order in plan_items:
        await fetch_or_insert(
            conn,
            ctx,
            table_key=tables.TIMELINE_PLAN_ITEMS,
            select_sql=f"""
                SELECT id FROM {tables.TIMELINE_PLAN_ITEMS}
                WHERE user_id = $1 AND plan_id = $2 AND title = $3
                ORDER BY id LIMIT 1
            """,
            select_args=(ctx.user_id, plan_id, title),
            insert_sql=f"""
                INSERT INTO {tables.TIMELINE_PLAN_ITEMS}
                    (user_id, plan_id, title, start_at, end_at, all_day, sort_order, status)
                VALUES ($1, $2, $3, $4, $5, TRUE, $6, 'planned')
                RETURNING id
            """,
            insert_args=(
                ctx.user_id,
                plan_id,
                title,
                date_at_midnight(start),
                date_at_midnight(end),
                sort_order,
            ),
        )
