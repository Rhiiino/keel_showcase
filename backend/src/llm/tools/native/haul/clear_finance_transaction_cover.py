# stack_sandbox/backend/src/llm/tools/native/haul/clear_shop_item_cover.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.haul._haul import dump_model, require_transaction_id
from modules.finance import service as finance_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Remove a shop item's cover image."""
    transaction_id = require_transaction_id(arguments)
    purchase = await finance_service.clear_transaction_cover(context.user_id, transaction_id)
    return {"transaction": dump_model(purchase)}


TOOL_DEFINITION = ToolDefinition(
    name="clear_finance_transaction_cover",
    category=HAUL,
    description="Remove a shop item's cover image.",
    parameters={
        "type": "object",
        "properties": {
            "transaction_id": {"type": "integer"},
        },
        "required": ["transaction_id"],
        "additionalProperties": False,
    },
    returns="{ item: object }",
    executor=execute,
)
