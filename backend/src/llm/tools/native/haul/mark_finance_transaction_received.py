# stack_sandbox/backend/src/llm/tools/native/haul/mark_shop_item_received.py

from __future__ import annotations

from datetime import datetime
from typing import Any

from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.haul._haul import dump_model, require_transaction_id
from modules.finance import service as finance_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Mark a shop item as received and set received_at."""
    transaction_id = require_transaction_id(arguments)
    received_at = arguments.get("received_at")
    parsed_received_at = None
    if isinstance(received_at, str):
        parsed_received_at = datetime.fromisoformat(received_at.replace("Z", "+00:00"))
    purchase = await finance_service.mark_transaction_received(
        context.user_id,
        transaction_id,
        received_at=parsed_received_at,
    )
    return {"transaction": dump_model(purchase)}


TOOL_DEFINITION = ToolDefinition(
    name="mark_finance_transaction_received",
    category=HAUL,
    description="Mark a shop item as received and set received_at.",
    parameters={
        "type": "object",
        "properties": {
            "transaction_id": {"type": "integer"},
            "received_at": {"type": "string", "description": "ISO-8601; defaults to now."},
        },
        "required": ["transaction_id"],
        "additionalProperties": False,
    },
    returns="{ item: object }",
    executor=execute,
)
