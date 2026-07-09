# stack_sandbox/backend/src/llm/tools/native/haul/delete_shop_item.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.haul._haul import require_transaction_id
from modules.finance import service as finance_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Delete a shop item and its media."""
    transaction_id = require_transaction_id(arguments)
    await finance_service.delete_transaction(context.user_id, transaction_id)
    return {"deleted": True, "transaction_id": transaction_id}


TOOL_DEFINITION = ToolDefinition(
    name="delete_finance_transaction",
    category=HAUL,
    description="Delete a shop item and its media.",
    parameters={
        "type": "object",
        "properties": {
            "transaction_id": {"type": "integer"},
        },
        "required": ["transaction_id"],
        "additionalProperties": False,
    },
    returns="{ deleted: boolean, transaction_id: number }",
    executor=execute,
)
