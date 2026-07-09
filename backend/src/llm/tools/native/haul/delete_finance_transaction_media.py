# keel_api/src/llm/tools/native/haul/delete_shop_item_media.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.haul._haul import require_transaction_id, require_media_id
from modules.media import service as media_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Delete one media attachment from a shop item."""
    transaction_id = require_transaction_id(arguments)
    media_id = require_media_id(arguments)
    attachments = await media_service.list_for_entity(
        context.user_id,
        "finance_transaction",
        transaction_id,
    )
    attachment = next((a for a in attachments if a.media_id == media_id), None)
    if attachment is None:
        raise AppError("Media attachment not found on this item.", status_code=404)
    await media_service.delete_attachment(context.user_id, attachment.id)
    return {
        "deleted": True,
        "transaction_id": transaction_id,
        "media_id": str(media_id),
        "attachment_id": attachment.id,
    }


TOOL_DEFINITION = ToolDefinition(
    name="delete_finance_transaction_media",
    category=HAUL,
    description="Delete one media file from a shop item.",
    parameters={
        "type": "object",
        "properties": {
            "transaction_id": {"type": "integer"},
            "media_id": {"type": "string", "description": "UUID of the media object."},
        },
        "required": ["transaction_id", "media_id"],
        "additionalProperties": False,
    },
    returns="{ deleted: boolean, transaction_id: number, media_id: string, attachment_id: number }",
    executor=execute,
)
