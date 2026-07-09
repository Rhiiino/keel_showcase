# stack_sandbox/backend/src/llm/tools/native/haul/get_shop_item.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.haul._haul import dump_model, dump_models, require_transaction_id
from modules.finance import service as finance_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Fetch one finance purchase with its media list."""
    transaction_id = require_transaction_id(arguments)
    purchase = await finance_service.get_transaction(context.user_id, transaction_id)
    media = []
    if purchase.cover is not None:
        media.append(purchase.cover)
    for attachment in purchase.gallery:
        if attachment.media is not None:
            media.append(attachment.media)
    return {"transaction": dump_model(purchase), "media": dump_models(media)}


TOOL_DEFINITION = ToolDefinition(
    name="get_finance_transaction",
    category=HAUL,
    description="Fetch one purchase with its media list.",
    parameters={
        "type": "object",
        "properties": {
            "transaction_id": {"type": "integer", "description": "Transaction id."},
        },
        "required": ["transaction_id"],
        "additionalProperties": False,
    },
    returns="{ transaction: object, media: object[] }",
    executor=execute,
)
