# keel_api/src/llm/tools/native/haul/set_shop_item_cover.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.haul._haul import dump_model, require_transaction_id, require_media_id
from modules.finance import service as finance_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Set a shop item cover from an existing image media file."""
    transaction_id = require_transaction_id(arguments)
    media_id = require_media_id(arguments)
    purchase = await finance_service.set_transaction_cover_from_media(
        context.user_id,
        transaction_id,
        media_id,
    )
    return {"transaction": dump_model(purchase)}


TOOL_DEFINITION = ToolDefinition(
    name="set_finance_transaction_cover",
    category=HAUL,
    description="Set a shop item cover from an existing image media file.",
    parameters={
        "type": "object",
        "properties": {
            "transaction_id": {"type": "integer"},
            "media_id": {"type": "string", "description": "UUID of the media object."},
        },
        "required": ["transaction_id", "media_id"],
        "additionalProperties": False,
    },
    returns="{ item: object }",
    executor=execute,
)
