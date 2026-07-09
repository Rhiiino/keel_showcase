# keel_showcase/backend/scripts/db/demo/seeds/journal.py

from __future__ import annotations

from datetime import timedelta

import asyncpg

from core import tables

from context import DemoContext, fetch_or_insert, upsert_tag


async def seed_journal(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    reflection_tag = await upsert_tag(
        conn, ctx, table=tables.JOURNAL_TAGS, user_id=ctx.user_id, name="Reflection", color="#8B5CF6"
    )
    work_tag = await upsert_tag(
        conn, ctx, table=tables.JOURNAL_TAGS, user_id=ctx.user_id, name="Work", color="#06B6D4"
    )
    personal_tag = await upsert_tag(
        conn, ctx, table=tables.JOURNAL_TAGS, user_id=ctx.user_id, name="Personal", color="#F97316"
    )

    entries = (
        (0, "Wrapped up showcase launch prep and verified each module has demo content.", (reflection_tag, work_tag)),
        (1, "Reviewed finance subscriptions and cleaned up vendor notes.", (work_tag,)),
        (2, "Family dinner with Morgan and the kids — kept the evening unplugged.", (personal_tag, reflection_tag)),
        (3, "Mapped focus lists for the week and archived one old project.", (work_tag,)),
        (4, "Short walk and journaling session before starting the day.", (reflection_tag, personal_tag)),
    )
    for days_ago, content, tag_ids in entries:
        entry_date = ctx.today - timedelta(days=days_ago)
        entry_id = await fetch_or_insert(
            conn,
            ctx,
            table_key=tables.JOURNAL_ENTRIES,
            select_sql=f"""
                SELECT id FROM {tables.JOURNAL_ENTRIES}
                WHERE user_id = $1 AND entry_date = $2 AND content = $3
                ORDER BY id LIMIT 1
            """,
            select_args=(ctx.user_id, entry_date, content),
            insert_sql=f"""
                INSERT INTO {tables.JOURNAL_ENTRIES}
                    (user_id, entry_date, content)
                VALUES ($1, $2, $3)
                RETURNING id
            """,
            insert_args=(ctx.user_id, entry_date, content),
        )
        for tag_id in tag_ids:
            await conn.execute(
                f"""
                INSERT INTO {tables.JOURNAL_ENTRY_TAG_ASSIGNMENTS} (journal_entry_id, tag_id)
                VALUES ($1, $2)
                ON CONFLICT (journal_entry_id, tag_id) DO NOTHING
                """,
                entry_id,
                tag_id,
            )
