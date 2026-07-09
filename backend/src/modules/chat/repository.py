# stack_sandbox/backend/src/modules/chat/repository.py
"""SQL access for chat (conversations, messages, tool_calls)."""

from __future__ import annotations

import json

import asyncpg

from core.tables import CHAT_RULES, CONVERSATIONS, MESSAGES, TOOL_CALLS, USERS

_CONVERSATION_COLUMNS = (
    "id, user_id, title, driver_agent_id, project_id, sort_order, created_at, updated_at"
)
_MESSAGE_COLUMNS = (
    "id, conversation_id, role, content, agent_id, agents_used, provider, model, "
    "input_tokens, output_tokens, created_at, updated_at"
)
_TOOL_CALL_COLUMNS = (
    "id, message_id, tool_name, category, call_order, duration_seconds, tool_response_json"
)
_RULE_COLUMNS = (
    "id, title, content, agent_ids, is_active, sort_order, created_at, updated_at"
)


# ----- Conversations
async def list_conversations(
    conn: asyncpg.Connection,
    user_id: int,
    *,
    global_only: bool = False,
    project_id: int | None = None,
) -> list[asyncpg.Record]:
    """List conversations for a user, optionally scoped by project."""
    conditions = ["user_id = $1"]
    params: list[object] = [user_id]
    if global_only:
        conditions.append("project_id IS NULL")
    if project_id is not None:
        params.append(project_id)
        conditions.append(f"project_id = ${len(params)}")
    where = " AND ".join(conditions)
    return await conn.fetch(
        f"""
        SELECT {_CONVERSATION_COLUMNS}
        FROM {CONVERSATIONS}
        WHERE {where}
        ORDER BY sort_order ASC, id ASC
        """,
        *params,
    )


async def get_conversation(
    conn: asyncpg.Connection,
    conversation_id: int,
) -> asyncpg.Record | None:
    """Fetch one conversation by id."""
    return await conn.fetchrow(
        f"""
        SELECT {_CONVERSATION_COLUMNS}
        FROM {CONVERSATIONS}
        WHERE id = $1
        """,
        conversation_id,
    )


async def next_conversation_sort_order(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    project_id: int | None,
) -> int:
    """Return the next sort_order for a new conversation in a scope."""
    value = await conn.fetchval(
        f"""
        SELECT COALESCE(MIN(sort_order), 0) - 1
        FROM {CONVERSATIONS}
        WHERE user_id = $1
          AND project_id IS NOT DISTINCT FROM $2
        """,
        user_id,
        project_id,
    )
    return int(value)


async def insert_conversation(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    title: str | None,
    driver_agent_id: str = "keel",
    project_id: int | None = None,
) -> asyncpg.Record:
    """Insert a new conversation row."""
    sort_order = await next_conversation_sort_order(
        conn,
        user_id=user_id,
        project_id=project_id,
    )
    row = await conn.fetchrow(
        f"""
        INSERT INTO {CONVERSATIONS} (
            user_id, title, driver_agent_id, project_id, sort_order
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING {_CONVERSATION_COLUMNS}
        """,
        user_id,
        title,
        driver_agent_id,
        project_id,
        sort_order,
    )
    if row is None:
        raise RuntimeError("Failed to insert conversation.")
    return row


async def update_conversation_title(
    conn: asyncpg.Connection,
    *,
    conversation_id: int,
    title: str,
) -> asyncpg.Record | None:
    """Update a conversation title."""
    return await conn.fetchrow(
        f"""
        UPDATE {CONVERSATIONS}
        SET title = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING {_CONVERSATION_COLUMNS}
        """,
        conversation_id,
        title,
    )


async def touch_conversation(
    conn: asyncpg.Connection,
    conversation_id: int,
) -> None:
    """Bump updated_at on a conversation."""
    await conn.execute(
        f"""
        UPDATE {CONVERSATIONS}
        SET updated_at = NOW()
        WHERE id = $1
        """,
        conversation_id,
    )


async def delete_conversation(
    conn: asyncpg.Connection,
    conversation_id: int,
) -> None:
    """Delete a conversation by id."""
    await conn.execute(
        f"DELETE FROM {CONVERSATIONS} WHERE id = $1",
        conversation_id,
    )


async def reorder_conversations(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    conversation_ids: list[int],
    global_only: bool = False,
    project_id: int | None = None,
) -> None:
    """Persist manual sort order for conversations in a list scope."""
    conditions = ["user_id = $1"]
    params: list[object] = [user_id]
    if global_only:
        conditions.append("project_id IS NULL")
    if project_id is not None:
        params.append(project_id)
        conditions.append(f"project_id = ${len(params)}")
    where = " AND ".join(conditions)
    rows = await conn.fetch(
        f"""
        SELECT id
        FROM {CONVERSATIONS}
        WHERE {where}
        ORDER BY sort_order ASC, id ASC
        """,
        *params,
    )
    existing_ids = {row["id"] for row in rows}
    if set(conversation_ids) != existing_ids:
        raise ValueError("conversation_ids must include every conversation in scope.")

    async with conn.transaction():
        for index, conversation_id in enumerate(conversation_ids):
            await conn.execute(
                f"""
                UPDATE {CONVERSATIONS}
                SET sort_order = $2
                WHERE id = $1 AND user_id = $3
                """,
                conversation_id,
                index,
                user_id,
            )


# ----- Messages
async def list_messages(
    conn: asyncpg.Connection,
    conversation_id: int,
) -> list[asyncpg.Record]:
    """List messages in a conversation, oldest first."""
    return await conn.fetch(
        f"""
        SELECT {_MESSAGE_COLUMNS}
        FROM {MESSAGES}
        WHERE conversation_id = $1
        ORDER BY created_at, id
        """,
        conversation_id,
    )


async def get_message(
    conn: asyncpg.Connection,
    message_id: int,
) -> asyncpg.Record | None:
    """Fetch one message by id."""
    return await conn.fetchrow(
        f"""
        SELECT {_MESSAGE_COLUMNS}
        FROM {MESSAGES}
        WHERE id = $1
        """,
        message_id,
    )


async def insert_message(
    conn: asyncpg.Connection,
    *,
    conversation_id: int,
    role: str,
    content: str,
    agent_id: str | None = None,
    agents_used: list[str] | None = None,
    provider: str | None = None,
    model: str | None = None,
    input_tokens: int | None = None,
    output_tokens: int | None = None,
) -> asyncpg.Record:
    """Insert a new message row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {MESSAGES} (
            conversation_id,
            role,
            content,
            agent_id,
            agents_used,
            provider,
            model,
            input_tokens,
            output_tokens
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING {_MESSAGE_COLUMNS}
        """,
        conversation_id,
        role,
        content,
        agent_id,
        agents_used or [],
        provider,
        model,
        input_tokens,
        output_tokens,
    )
    if row is None:
        raise RuntimeError("Failed to insert message.")
    return row


async def update_message_content(
    conn: asyncpg.Connection,
    *,
    message_id: int,
    content: str,
) -> asyncpg.Record | None:
    """Update a message content field."""
    return await conn.fetchrow(
        f"""
        UPDATE {MESSAGES}
        SET content = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING {_MESSAGE_COLUMNS}
        """,
        message_id,
        content,
    )


async def delete_message(
    conn: asyncpg.Connection,
    message_id: int,
) -> None:
    """Delete a message by id."""
    await conn.execute(
        f"DELETE FROM {MESSAGES} WHERE id = $1",
        message_id,
    )


# ----- Tool calls (assistant tool invocations; populated by the orchestrator)
async def insert_tool_call(
    conn: asyncpg.Connection,
    *,
    message_id: int,
    tool_name: str,
    category: str | None,
    tool_call_json: dict,
    tool_response_json: dict | None,
    duration_seconds: float | None,
    call_order: int,
) -> asyncpg.Record:
    """Insert a tool call row linked to an assistant message."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {TOOL_CALLS} (
            message_id,
            tool_name,
            category,
            tool_call_json,
            tool_response_json,
            duration_seconds,
            call_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, message_id, tool_name, category, call_order, created_at
        """,
        message_id,
        tool_name,
        category,
        json.dumps(tool_call_json),
        json.dumps(tool_response_json) if tool_response_json is not None else None,
        duration_seconds,
        call_order,
    )
    if row is None:
        raise RuntimeError("Failed to insert tool call.")
    return row


async def list_tool_calls_for_messages(
    conn: asyncpg.Connection,
    message_ids: list[int],
) -> list[asyncpg.Record]:
    """List tool calls for the given message ids."""
    if not message_ids:
        return []
    return await conn.fetch(
        f"""
        SELECT {_TOOL_CALL_COLUMNS}
        FROM {TOOL_CALLS}
        WHERE message_id = ANY($1::int[])
        ORDER BY message_id, call_order, id
        """,
        message_ids,
    )


# ----- User LLM preferences
async def get_user_llm_preferences(
    conn: asyncpg.Connection,
    user_id: int,
) -> asyncpg.Record | None:
    """Fetch saved chat LLM preferences for a user."""
    return await conn.fetchrow(
        f"""
        SELECT chat_llm_provider, chat_llm_model
        FROM {USERS}
        WHERE id = $1
        """,
        user_id,
    )


async def update_user_llm_preferences(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    provider: str,
    model: str,
) -> asyncpg.Record | None:
    """Update saved chat LLM preferences for a user."""
    return await conn.fetchrow(
        f"""
        UPDATE {USERS}
        SET chat_llm_provider = $2,
            chat_llm_model = $3,
            updated_at = NOW()
        WHERE id = $1
        RETURNING chat_llm_provider, chat_llm_model
        """,
        user_id,
        provider,
        model,
    )


# ----- Chat rules (per-user system prompt additions)
async def list_rules(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List all chat rules for a user."""
    return await conn.fetch(
        f"""
        SELECT {_RULE_COLUMNS}
        FROM {CHAT_RULES}
        WHERE user_id = $1
        ORDER BY sort_order ASC, id ASC
        """,
        user_id,
    )


async def get_rule(
    conn: asyncpg.Connection,
    rule_id: int,
) -> asyncpg.Record | None:
    """Fetch one chat rule by id."""
    return await conn.fetchrow(
        f"""
        SELECT user_id, {_RULE_COLUMNS}
        FROM {CHAT_RULES}
        WHERE id = $1
        """,
        rule_id,
    )


async def list_active_rules(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List active chat rules for a user."""
    return await conn.fetch(
        f"""
        SELECT title, content, agent_ids, sort_order
        FROM {CHAT_RULES}
        WHERE user_id = $1 AND is_active = TRUE
        ORDER BY sort_order ASC, id ASC
        """,
        user_id,
    )


async def insert_rule(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    title: str,
    content: str,
    agent_ids: list[str],
    is_active: bool,
    sort_order: int,
) -> asyncpg.Record:
    """Insert a new chat rule row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {CHAT_RULES} (
            user_id, title, content, agent_ids, is_active, sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING {_RULE_COLUMNS}
        """,
        user_id,
        title,
        content,
        agent_ids,
        is_active,
        sort_order,
    )
    if row is None:
        raise RuntimeError("Failed to insert chat rule.")
    return row


async def update_rule(
    conn: asyncpg.Connection,
    *,
    rule_id: int,
    user_id: int,
    title: str,
    content: str,
    agent_ids: list[str],
    is_active: bool,
    sort_order: int,
) -> asyncpg.Record | None:
    """Update an owned chat rule row."""
    return await conn.fetchrow(
        f"""
        UPDATE {CHAT_RULES}
        SET title = $3,
            content = $4,
            agent_ids = $5,
            is_active = $6,
            sort_order = $7,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING {_RULE_COLUMNS}
        """,
        rule_id,
        user_id,
        title,
        content,
        agent_ids,
        is_active,
        sort_order,
    )


async def delete_rule(
    conn: asyncpg.Connection,
    *,
    rule_id: int,
    user_id: int,
) -> None:
    """Delete an owned chat rule."""
    await conn.execute(
        f"DELETE FROM {CHAT_RULES} WHERE id = $1 AND user_id = $2",
        rule_id,
        user_id,
    )
