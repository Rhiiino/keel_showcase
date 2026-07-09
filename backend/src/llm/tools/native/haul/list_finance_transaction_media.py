# keel_api/src/llm/tools/native/haul/list_shop_item_media.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.haul._haul import dump_models, require_transaction_id
from modules.media import service as media_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List media files attached to a shop item."""
    transaction_id = require_transaction_id(arguments)
    attachments = await media_service.list_for_entity(
        context.user_id,
        "finance_transaction",
        transaction_id,
    )
    return {"media": dump_models(attachments)}


TOOL_DEFINITION = ToolDefinition(
    name="list_finance_transaction_media",
    category=HAUL,
    description="List media files attached to a shop item.",
    parameters={
        "type": "object",
        "properties": {
            "transaction_id": {"type": "integer"},
        },
        "required": ["transaction_id"],
        "additionalProperties": False,
    },
    returns="{ media: object[] }",
    executor=execute,
)
