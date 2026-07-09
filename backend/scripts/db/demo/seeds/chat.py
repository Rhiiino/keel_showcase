# keel_showcase/backend/scripts/db/demo/seeds/chat.py

from __future__ import annotations

import asyncpg

from core import tables

from context import DemoContext, fetch_or_insert


async def _seed_conversation(
    conn: asyncpg.Connection,
    ctx: DemoContext,
    title: str,
    sort_order: int,
    messages: tuple[tuple[str, str, str | None, str | None, str | None], ...],
) -> None:
    conversation_id = await fetch_or_insert(
        conn,
        ctx,
        table_key=tables.CONVERSATIONS,
        select_sql=f"""
            SELECT id FROM {tables.CONVERSATIONS}
            WHERE user_id = $1 AND title = $2
            ORDER BY id LIMIT 1
        """,
        select_args=(ctx.user_id, title),
        insert_sql=f"""
            INSERT INTO {tables.CONVERSATIONS}
                (user_id, title, driver_agent_id, sort_order)
            VALUES ($1, $2, 'keel', $3)
            RETURNING id
        """,
        insert_args=(ctx.user_id, title, sort_order),
    )
    has_messages = await conn.fetchval(
        f"SELECT 1 FROM {tables.MESSAGES} WHERE conversation_id = $1 LIMIT 1",
        conversation_id,
    )
    if has_messages is not None:
        ctx.stats.reused_one(tables.MESSAGES)
        return

    for role, content, agent_id, provider, model in messages:
        await conn.execute(
            f"""
            INSERT INTO {tables.MESSAGES}
                (conversation_id, role, content, agent_id, provider, model)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            conversation_id,
            role,
            content,
            agent_id,
            provider,
            model,
        )
        ctx.stats.inserted_one(tables.MESSAGES)


async def seed_chat(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    await _seed_conversation(
        conn,
        ctx,
        "Demo: Planning Session",
        0,
        (
            ("user", "Help me plan the demo launch checklist.", None, None, None),
            (
                "assistant",
                "I created a short plan and linked it to your demo Focus sprint.",
                "keel",
                "openai",
                "gpt-4.1-mini",
            ),
        ),
    )
    await _seed_conversation(
        conn,
        ctx,
        "Demo: Finance Review",
        1,
        (
            ("user", "What are my active subscriptions this month?", None, None, None),
            (
                "assistant",
                "You have StreamFlix, CloudHost Pro, a gym membership, and a trial News Digest subscription.",
                "keel",
                "openai",
                "gpt-4.1-mini",
            ),
        ),
    )

    rule_exists = await conn.fetchval(
        f"""
        SELECT id FROM {tables.CHAT_RULES}
        WHERE user_id = $1 AND title = 'Demo: concise planning'
        LIMIT 1
        """,
        ctx.user_id,
    )
    if rule_exists is None:
        await conn.execute(
            f"""
            INSERT INTO {tables.CHAT_RULES}
                (user_id, title, content, agent_ids, sort_order)
            VALUES ($1, 'Demo: concise planning', 'Keep demo planning responses concise and action-oriented.', ARRAY['keel'], 0)
            """,
            ctx.user_id,
        )
        ctx.stats.inserted_one(tables.CHAT_RULES)
    else:
        ctx.stats.reused_one(tables.CHAT_RULES)

    await conn.execute(
        f"""
        INSERT INTO {tables.AGENT_LLM_PREFERENCES}
            (user_id, agent_id, llm_provider, llm_model)
        VALUES ($1, 'keel', 'openai', 'gpt-4.1-mini')
        ON CONFLICT (user_id, agent_id) DO NOTHING
        """,
        ctx.user_id,
    )
