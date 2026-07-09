# stack_sandbox/backend/src/modules/chat/service.py
"""Business logic for the chat module: ownership guards, CRUD, and streaming turns."""

from __future__ import annotations

import json
import logging
import time
from typing import AsyncIterator

import asyncpg

from core.database import get_pool
from core.errors import AppError
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from llm.agents.registry import get_agent
from llm.models.registry import (
    get_model,
    get_models_for_provider,
    is_known_provider,
    list_provider_ids,
)
from llm.orchestrator.events import EventName
from llm.agents.llm_prefs import build_llm_prefs_by_agent
from llm.orchestrator.keel import handle_turn
from llm.prompts.registry import merge_rule_entries_to_block
from llm.providers.base import ChatTurn
from llm.providers.factory import env_fallback_provider_name, resolve_model_id
from llm.sse import sse_event
from modules.auth.schemas import CurrentUserResponse
from modules.chat import config, repository
from modules.chat.schemas import (
    ChatPreferencesPublic,
    ChatPreferencesUpdate,
    ChatRuleCreate,
    ChatRulePublic,
    ChatRuleUpdate,
    ConversationCreate,
    ConversationPublic,
    ConversationReorder,
    ConversationUpdate,
    MessageCreate,
    MessagePublic,
    MessageRole,
    ToolCallPublic,
    MessageUpdate,
    ModelProviderGroup,
    ModelPublic,
    StreamRequest,
)

logger = logging.getLogger(__name__)

# Roles included in the history sent to the model.
_MODEL_HISTORY_ROLES = {MessageRole.USER.value, MessageRole.ASSISTANT.value}


# ----- Record mappers
def _record_to_conversation(row: asyncpg.Record) -> ConversationPublic:
    """Map a conversations row to the public API model."""
    return ConversationPublic(
        id=row["id"],
        user_id=row["user_id"],
        title=row["title"],
        driver_agent_id=row["driver_agent_id"],
        project_id=row["project_id"],
        sort_order=row["sort_order"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _record_to_message(
    row: asyncpg.Record,
    *,
    tool_calls: list[ToolCallPublic] | None = None,
) -> MessagePublic:
    """Map a messages row to the public API model."""
    return MessagePublic(
        id=row["id"],
        conversation_id=row["conversation_id"],
        role=MessageRole(row["role"]),
        content=row["content"],
        agent_id=row["agent_id"],
        agents_used=list(row["agents_used"] or []),
        provider=row["provider"],
        model=row["model"],
        input_tokens=row["input_tokens"],
        output_tokens=row["output_tokens"],
        tool_calls=tool_calls or [],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _tool_call_success(tool_response_json: object | None) -> bool | None:
    """Derive tool-call success from stored response JSON."""
    if tool_response_json is None:
        return None
    if isinstance(tool_response_json, dict):
        return "error" not in tool_response_json
    return None


def _record_to_tool_call(row: asyncpg.Record) -> ToolCallPublic:
    """Map a `tool_calls` row to the public API model (success derived from response JSON)."""
    return ToolCallPublic(
        id=row["id"],
        tool_name=row["tool_name"],
        category=row["category"],
        call_order=row["call_order"],
        duration_seconds=row["duration_seconds"],
        success=_tool_call_success(row["tool_response_json"]),
    )


def _record_to_rule(row: asyncpg.Record) -> ChatRulePublic:
    """Map a `chat_rules` row to the public API model."""
    return ChatRulePublic(
        id=row["id"],
        title=row["title"],
        content=row["content"],
        agent_ids=list(row["agent_ids"]),
        is_active=row["is_active"],
        sort_order=row["sort_order"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _normalize_agent_ids(agent_ids: list[str]) -> list[str]:
    """Validate, dedupe, and normalize agent id strings."""
    seen: set[str] = set()
    normalized: list[str] = []
    for agent_id in agent_ids:
        trimmed = agent_id.strip()
        if not trimmed or trimmed in seen:
            continue
        get_agent(trimmed)
        seen.add(trimmed)
        normalized.append(trimmed)
    if not normalized:
        raise AppError("At least one valid agent_id is required.", status_code=400)
    return normalized


def _build_rules_by_agent(rows: list[asyncpg.Record]) -> dict[str, str]:
    """Group active rules by agent id, preserving sort order within each agent."""
    entries_by_agent: dict[str, list[tuple[str, str]]] = {}
    for row in rows:
        entry = (row["title"], row["content"])
        for agent_id in row["agent_ids"]:
            entries_by_agent.setdefault(agent_id, []).append(entry)
    return {
        agent_id: merge_rule_entries_to_block(entries)
        for agent_id, entries in entries_by_agent.items()
        if merge_rule_entries_to_block(entries)
    }


async def _load_rules_by_agent(user_id: int) -> dict[str, str]:
    """Load active chat rules grouped by agent id for a user."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_active_rules(conn, user_id)
    return _build_rules_by_agent(rows)


async def get_rules_block_for_agent(user_id: int, agent_id: str) -> str:
    """Return merged active chat rules text for one agent (used by subagents prompt preview)."""
    rules_by_agent = await _load_rules_by_agent(user_id)
    return rules_by_agent.get(agent_id, "")


# ----- Ownership guards
async def _load_owned_conversation(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    conversation_id: int,
) -> asyncpg.Record:
    """Return the conversation row or raise 404 if missing or not owned by the user."""
    row = await repository.get_conversation(conn, conversation_id)
    if row is None or row["user_id"] != user_id:
        raise AppError("Conversation not found", status_code=404)
    return row


async def _load_owned_message(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    conversation_id: int,
    message_id: int,
) -> asyncpg.Record:
    """Return the message row or raise 404 if missing, not in the conversation, or not owned."""
    await _load_owned_conversation(conn, user_id=user_id, conversation_id=conversation_id)
    row = await repository.get_message(conn, message_id)
    if row is None or row["conversation_id"] != conversation_id:
        raise AppError("Message not found", status_code=404)
    return row


# ----- Conversations
async def list_conversations(
    user_id: int,
    *,
    global_only: bool = False,
    project_id: int | None = None,
) -> list[ConversationPublic]:
    """List conversations for a user in manual sort order."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_conversations(
            conn,
            user_id,
            global_only=global_only,
            project_id=project_id,
        )
    return [_record_to_conversation(row) for row in rows]


async def create_conversation(
    user_id: int,
    payload: ConversationCreate,
) -> ConversationPublic:
    """Create a new conversation owned by the user."""
    get_agent(payload.driver_agent_id)

    if payload.project_id is not None:
        from modules.projects import service as projects_service

        await projects_service.get_project(user_id, payload.project_id)

    title = payload.title or config.DEFAULT_CONVERSATION_TITLE
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.insert_conversation(
            conn,
            user_id=user_id,
            title=title,
            driver_agent_id=payload.driver_agent_id,
            project_id=payload.project_id,
        )
    return _record_to_conversation(row)


async def get_conversation(user_id: int, conversation_id: int) -> ConversationPublic:
    """Fetch one owned conversation."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await _load_owned_conversation(
            conn, user_id=user_id, conversation_id=conversation_id
        )
    return _record_to_conversation(row)


async def update_conversation(
    user_id: int,
    conversation_id: int,
    payload: ConversationUpdate,
) -> ConversationPublic:
    """Rename an owned conversation."""
    pool = get_pool()
    async with pool.acquire() as conn:
        await _load_owned_conversation(
            conn, user_id=user_id, conversation_id=conversation_id
        )
        row = await repository.update_conversation_title(
            conn, conversation_id=conversation_id, title=payload.title
        )
    if row is None:
        raise AppError("Conversation not found", status_code=404)
    return _record_to_conversation(row)


async def delete_conversation(user_id: int, conversation_id: int) -> None:
    """Delete an owned conversation and its messages."""
    pool = get_pool()
    async with pool.acquire() as conn:
        await _load_owned_conversation(
            conn, user_id=user_id, conversation_id=conversation_id
        )
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.CHAT_CONVERSATION,
        str(conversation_id),
    )


async def reorder_conversations(
    user_id: int,
    payload: ConversationReorder,
) -> list[ConversationPublic]:
    """Persist a new manual order for conversations in a list scope."""
    if payload.global_only and payload.project_id is not None:
        raise AppError(
            "Use either global_only or project_id, not both.",
            status_code=400,
        )

    if payload.project_id is not None:
        from modules.projects import service as projects_service

        await projects_service.get_project(user_id, payload.project_id)

    pool = get_pool()
    async with pool.acquire() as conn:
        try:
            await repository.reorder_conversations(
                conn,
                user_id=user_id,
                conversation_ids=payload.conversation_ids,
                global_only=payload.global_only,
                project_id=payload.project_id,
            )
        except ValueError as exc:
            raise AppError(str(exc), status_code=400) from exc
        rows = await repository.list_conversations(
            conn,
            user_id,
            global_only=payload.global_only,
            project_id=payload.project_id,
        )
    return [_record_to_conversation(row) for row in rows]


# ----- Messages
async def list_messages(user_id: int, conversation_id: int) -> list[MessagePublic]:
    """List messages in an owned conversation, oldest first."""
    pool = get_pool()
    async with pool.acquire() as conn:
        await _load_owned_conversation(
            conn, user_id=user_id, conversation_id=conversation_id
        )
        rows = await repository.list_messages(conn, conversation_id)
        assistant_ids = [row["id"] for row in rows if row["role"] == MessageRole.ASSISTANT.value]
        tool_rows = await repository.list_tool_calls_for_messages(conn, assistant_ids)

    tools_by_message: dict[int, list[ToolCallPublic]] = {}
    for tool_row in tool_rows:
        message_id = tool_row["message_id"]
        tools_by_message.setdefault(message_id, []).append(_record_to_tool_call(tool_row))

    return [
        _record_to_message(row, tool_calls=tools_by_message.get(row["id"], []))
        for row in rows
    ]


async def create_message(
    user_id: int,
    conversation_id: int,
    payload: MessageCreate,
) -> MessagePublic:
    """Create a `user` message. Assistant messages are produced by the orchestrator."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await _load_owned_conversation(
                conn, user_id=user_id, conversation_id=conversation_id
            )
            row = await repository.insert_message(
                conn,
                conversation_id=conversation_id,
                role=MessageRole.USER.value,
                content=payload.content,
            )
            await repository.touch_conversation(conn, conversation_id)
    return _record_to_message(row)


async def get_message(
    user_id: int,
    conversation_id: int,
    message_id: int,
) -> MessagePublic:
    """Fetch one message in an owned conversation."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await _load_owned_message(
            conn,
            user_id=user_id,
            conversation_id=conversation_id,
            message_id=message_id,
        )
        tool_rows = await repository.list_tool_calls_for_messages(conn, [message_id])
    return _record_to_message(
        row,
        tool_calls=[_record_to_tool_call(tool_row) for tool_row in tool_rows],
    )


async def update_message(
    user_id: int,
    conversation_id: int,
    message_id: int,
    payload: MessageUpdate,
) -> MessagePublic:
    """Edit the content of an owned user message."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            existing = await _load_owned_message(
                conn,
                user_id=user_id,
                conversation_id=conversation_id,
                message_id=message_id,
            )
            if existing["role"] != MessageRole.USER.value:
                raise AppError("Only user messages can be edited", status_code=403)
            row = await repository.update_message_content(
                conn, message_id=message_id, content=payload.content
            )
            await repository.touch_conversation(conn, conversation_id)
    if row is None:
        raise AppError("Message not found", status_code=404)
    return _record_to_message(row)


async def delete_message(
    user_id: int,
    conversation_id: int,
    message_id: int,
) -> None:
    """Delete a message from an owned conversation."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await _load_owned_message(
                conn,
                user_id=user_id,
                conversation_id=conversation_id,
                message_id=message_id,
            )
            await repository.delete_message(conn, message_id)
            await repository.touch_conversation(conn, conversation_id)


# ----- LLM model catalog + user preferences
async def _load_user_llm_preferences(
    conn: asyncpg.Connection,
    user_id: int,
) -> tuple[str | None, str | None]:
    """Load saved chat LLM provider and model for a user."""
    row = await repository.get_user_llm_preferences(conn, user_id)
    if row is None:
        return None, None
    return row["chat_llm_provider"], row["chat_llm_model"]


async def resolve_user_llm(user_id: int) -> ChatPreferencesPublic:
    """Resolved provider, model, and context window for a user."""
    pool = get_pool()
    async with pool.acquire() as conn:
        saved_provider, saved_model = await _load_user_llm_preferences(conn, user_id)

    provider = (saved_provider or env_fallback_provider_name()).strip().lower()
    model_id = resolve_model_id(provider_name=provider, model=saved_model)
    entry = get_model(model_id)
    if entry is None:
        raise AppError("Configured model is not in the registry.", status_code=500)

    return ChatPreferencesPublic(
        provider=provider,
        model_id=model_id,
        max_context_window=entry["max_context_window"] or 0,
    )


def list_models() -> list[ModelProviderGroup]:
    """All registered models grouped by provider."""
    groups: list[ModelProviderGroup] = []
    for provider in list_provider_ids():
        models = get_models_for_provider(provider)
        groups.append(
            ModelProviderGroup(
                provider=provider,
                models=[
                    ModelPublic(
                        id=m["id"],
                        provider=m["provider"],
                        display_name=m["display_name"],
                        max_context_window=m["max_context_window"] or 0,
                        input_price_per_1m=m["input_price_per_1m"],
                        output_price_per_1m=m["output_price_per_1m"],
                    )
                    for m in models
                ],
            )
        )
    return groups


async def get_preferences(user_id: int) -> ChatPreferencesPublic:
    """Return the user's resolved LLM provider and model."""
    return await resolve_user_llm(user_id)


async def update_preferences(
    user_id: int,
    payload: ChatPreferencesUpdate,
) -> ChatPreferencesPublic:
    """Update the user's saved LLM provider and model."""
    provider = payload.provider.strip().lower()
    if not is_known_provider(provider):
        raise AppError(f"Unknown provider: {provider!r}", status_code=400)

    model_id = resolve_model_id(provider_name=provider, model=payload.model_id)
    entry = get_model(model_id)
    if entry is None:
        raise AppError("Model not found in registry.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.update_user_llm_preferences(
            conn,
            user_id=user_id,
            provider=provider,
            model=model_id,
        )
    if row is None:
        raise AppError("User not found", status_code=404)

    return ChatPreferencesPublic(
        provider=provider,
        model_id=model_id,
        max_context_window=entry["max_context_window"] or 0,
    )


# ----- Streaming turn (Keel orchestrator)
async def stream_turn(
    user: CurrentUserResponse,
    conversation_id: int,
    payload: StreamRequest,
) -> AsyncIterator[str]:
    """Persist the user turn, run the orchestrator, and yield SSE frames.

    Persistence stays here (the chat module owns the database): the user message
    is saved before streaming; the assistant message and any tool calls are saved
    in one transaction once the orchestrator emits its `COMPLETED` event.
    """
    pool = get_pool()
    turn_started_at = time.monotonic()

    # ----- Save message + construct history
    async with pool.acquire() as conn:
        async with conn.transaction():
            conv_row = await _load_owned_conversation(
                conn, user_id=user.id, conversation_id=conversation_id
            )
            user_row = await repository.insert_message(
                conn,
                conversation_id=conversation_id,
                role=MessageRole.USER.value,
                content=payload.content,
            )
            await repository.touch_conversation(conn, conversation_id)
        history_rows = await repository.list_messages(conn, conversation_id)

    force_agent_id: str | None = conv_row["driver_agent_id"]
    tool_project_id: int | None = conv_row["project_id"]
    extra_context_block = ""

    if tool_project_id is not None and payload.canvas_context is not None:
        extra_context_block = (
            "Current canvas view:\n```json\n"
            f"{json.dumps(payload.canvas_context, indent=2, default=str)}\n```"
        )

    yield sse_event(
        EventName.USER_MESSAGE,
        {"id": user_row["id"], "content": user_row["content"]},
    )

    history = [
        ChatTurn(role=row["role"], content=row["content"])
        for row in history_rows
        if row["role"] in _MODEL_HISTORY_ROLES
    ]
    user_context = {"display_name": user.display_name}
    llm_prefs = await resolve_user_llm(user.id)
    llm_by_agent = await build_llm_prefs_by_agent(
        user.id,
        global_provider=llm_prefs.provider,
        global_model_id=llm_prefs.model_id,
    )
    rules_by_agent = await _load_rules_by_agent(user.id)

    # ----- Main request processing
    try:
        completed: dict | None = None
        async for event in handle_turn(
            history=history,
            user_id=user.id,
            user_context=user_context,
            llm_by_agent=llm_by_agent,
            rules_by_agent=rules_by_agent,
            force_agent_id=force_agent_id,
            extra_context_block=extra_context_block,
            tool_project_id=tool_project_id,
            conversation_id=conversation_id,
        ):
            if event.name == EventName.COMPLETED:
                completed = event.data
                continue
            yield sse_event(event.name, event.data)

        if completed is None:
            yield sse_event(EventName.ERROR, {"message": "No completion was produced."})
            return

        usage = completed.get("usage") or {}
        async with pool.acquire() as conn:
            async with conn.transaction():
                assistant_row = await repository.insert_message(
                    conn,
                    conversation_id=conversation_id,
                    role=MessageRole.ASSISTANT.value,
                    content=completed["content"],
                    agent_id=completed.get("agent_id"),
                    agents_used=list(completed.get("agents_used") or []),
                    provider=completed.get("provider"),
                    model=completed.get("model"),
                    input_tokens=usage.get("prompt_tokens"),
                    output_tokens=usage.get("completion_tokens"),
                )
                for record in completed.get("tool_calls", []):
                    await repository.insert_tool_call(
                        conn,
                        message_id=assistant_row["id"],
                        tool_name=record["tool_name"],
                        category=record["category"],
                        tool_call_json=record["tool_call_json"],
                        tool_response_json=record["tool_response_json"],
                        duration_seconds=record["duration_seconds"],
                        call_order=record["call_order"],
                    )
                await repository.touch_conversation(conn, conversation_id)

        yield sse_event(
            EventName.ASSISTANT_MESSAGE,
            {
                "id": assistant_row["id"],
                "agent_id": completed.get("agent_id"),
                "content": assistant_row["content"],
            },
        )
        yield sse_event(
            EventName.DONE,
            {
                "finish_reason": completed.get("finish_reason"),
                "usage": completed.get("usage"),
                "duration_seconds": time.monotonic() - turn_started_at,
            },
        )
    except AppError as exc:
        yield sse_event(EventName.ERROR, {"message": exc.message})
    except Exception:  # keep the stream well-formed even on unexpected failure
        logger.exception("Streaming turn failed for conversation %s", conversation_id)
        yield sse_event(
            EventName.ERROR,
            {"message": "Internal error while generating a response."},
        )


# ----- Chat rules
async def _load_owned_rule(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    rule_id: int,
) -> asyncpg.Record:
    """Return the rule row or raise 404 if missing or not owned."""
    row = await repository.get_rule(conn, rule_id)
    if row is None or row["user_id"] != user_id:
        raise AppError("Rule not found", status_code=404)
    return row


async def list_rules(user_id: int) -> list[ChatRulePublic]:
    """List all chat rules for a user."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_rules(conn, user_id)
    return [_record_to_rule(row) for row in rows]


async def create_rule(user_id: int, payload: ChatRuleCreate) -> ChatRulePublic:
    """Create a new chat rule for a user."""
    agent_ids = _normalize_agent_ids(payload.agent_ids)
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.insert_rule(
            conn,
            user_id=user_id,
            title=payload.title.strip(),
            content=payload.content.strip(),
            agent_ids=agent_ids,
            is_active=payload.is_active,
            sort_order=0,
        )
    return _record_to_rule(row)


async def update_rule(
    user_id: int,
    rule_id: int,
    payload: ChatRuleUpdate,
) -> ChatRulePublic:
    """Update an owned chat rule."""
    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await _load_owned_rule(conn, user_id=user_id, rule_id=rule_id)
        title = payload.title.strip() if payload.title is not None else existing["title"]
        content = (
            payload.content.strip() if payload.content is not None else existing["content"]
        )
        agent_ids = (
            _normalize_agent_ids(payload.agent_ids)
            if payload.agent_ids is not None
            else list(existing["agent_ids"])
        )
        is_active = (
            payload.is_active if payload.is_active is not None else existing["is_active"]
        )
        sort_order = (
            payload.sort_order if payload.sort_order is not None else existing["sort_order"]
        )
        row = await repository.update_rule(
            conn,
            rule_id=rule_id,
            user_id=user_id,
            title=title,
            content=content,
            agent_ids=agent_ids,
            is_active=is_active,
            sort_order=sort_order,
        )
    if row is None:
        raise AppError("Rule not found", status_code=404)
    return _record_to_rule(row)


async def delete_rule(user_id: int, rule_id: int) -> None:
    """Delete an owned chat rule."""
    pool = get_pool()
    async with pool.acquire() as conn:
        await _load_owned_rule(conn, user_id=user_id, rule_id=rule_id)
        await repository.delete_rule(conn, rule_id=rule_id, user_id=user_id)
