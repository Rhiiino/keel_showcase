# keel_api/src/modules/deleted/handlers/chat.py
"""Trash handlers for chat conversations (Option B — whole conversation only)."""

from __future__ import annotations

from core.errors import AppError
from core.tables import CONVERSATIONS, MESSAGES, TOOL_CALLS
from modules.chat import repository as chat_repository
from modules.deleted import entity_types
from modules.deleted.handlers._protocol import CaptureResult, DeletedEntityHandler
from modules.deleted.handlers._utils import (
    build_label,
    fetch_rows,
    record_to_dict,
    restore_table_rows,
)


class ChatConversationHandler:
    entity_type = entity_types.CHAT_CONVERSATION

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        conversation_id = int(entity_id)
        row = await chat_repository.get_conversation(conn, conversation_id)
        if row is None or row["user_id"] != user_id:
            raise AppError("Conversation not found", status_code=404)
        messages = await fetch_rows(
            conn,
            MESSAGES,
            where_sql="conversation_id = $1",
            params=(conversation_id,),
            order_by="id",
        )
        message_ids = [message["id"] for message in messages]
        tool_calls: list = []
        if message_ids:
            tool_calls = await conn.fetch(
                f"""
                SELECT * FROM {TOOL_CALLS}
                WHERE message_id = ANY($1::int[])
                ORDER BY message_id, call_order, id
                """,
                message_ids,
            )
        return CaptureResult(
            display_label=build_label(row, "title", fallback=f"Conversation {conversation_id}"),
            payload={
                "conversation": record_to_dict(row),
                "messages": [record_to_dict(message) for message in messages],
                "tool_calls": [record_to_dict(call) for call in tool_calls],
            },
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        conversation_id = int(entity_id)
        row = await chat_repository.get_conversation(conn, conversation_id)
        if row is None or row["user_id"] != user_id:
            raise AppError("Conversation not found", status_code=404)
        await chat_repository.delete_conversation(conn, conversation_id)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, CONVERSATIONS, [payload["conversation"]])
        await restore_table_rows(conn, MESSAGES, payload.get("messages", []))
        await restore_table_rows(conn, TOOL_CALLS, payload.get("tool_calls", []))
        return str(payload["conversation"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


HANDLERS: tuple[DeletedEntityHandler, ...] = (ChatConversationHandler(),)
