# stack_sandbox/backend/src/modules/subagents/repository.py
"""SQL access for per-user sub-agent LLM preferences."""

from __future__ import annotations

import asyncpg

from core.tables import AGENT_LLM_PREFERENCES


async def get_agent_llm_preferences(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    agent_id: str,
) -> asyncpg.Record | None:
    """Fetch per-agent LLM preferences for a user."""
    return await conn.fetchrow(
        f"""
        SELECT llm_provider, llm_model, created_at, updated_at
        FROM {AGENT_LLM_PREFERENCES}
        WHERE user_id = $1 AND agent_id = $2
        """,
        user_id,
        agent_id,
    )


async def list_agent_llm_preferences(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List all per-agent LLM preference rows for a user."""
    return await conn.fetch(
        f"""
        SELECT agent_id, llm_provider, llm_model
        FROM {AGENT_LLM_PREFERENCES}
        WHERE user_id = $1
        """,
        user_id,
    )


async def upsert_agent_llm_preferences(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    agent_id: str,
    provider: str,
    model: str,
) -> asyncpg.Record:
    """Insert or update per-agent LLM preferences for a user."""
    return await conn.fetchrow(
        f"""
        INSERT INTO {AGENT_LLM_PREFERENCES} (
            user_id, agent_id, llm_provider, llm_model
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, agent_id) DO UPDATE SET
            llm_provider = EXCLUDED.llm_provider,
            llm_model = EXCLUDED.llm_model,
            updated_at = NOW()
        RETURNING llm_provider, llm_model, created_at, updated_at
        """,
        user_id,
        agent_id,
        provider,
        model,
    )


async def delete_agent_llm_preferences(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    agent_id: str,
) -> bool:
    """Delete per-agent LLM preferences; return whether a row was removed."""
    result = await conn.execute(
        f"""
        DELETE FROM {AGENT_LLM_PREFERENCES}
        WHERE user_id = $1 AND agent_id = $2
        """,
        user_id,
        agent_id,
    )
    return result.endswith("1")
