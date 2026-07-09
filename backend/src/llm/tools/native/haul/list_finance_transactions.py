# stack_sandbox/backend/src/llm/tools/native/haul/list_shop_items.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.haul._haul import dump_models
from modules.finance import service as finance_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List the user's shop items (purchases, wishlist, orders)."""
    status = arguments.get("status")
    vendor_id = arguments.get("vendor_id")
    query = arguments.get("query")
    items = await finance_service.list_transactions(
        context.user_id,
        status=status if isinstance(status, str) else None,
        vendor_id=vendor_id if isinstance(vendor_id, int) else None,
        query=query if isinstance(query, str) else None,
    )
    return {"purchases": dump_models(items)}


TOOL_DEFINITION = ToolDefinition(
    name="list_finance_transactions",
    category=HAUL,
    description="List the user's shop items (purchases, wishlist, orders).",
    parameters={
        "type": "object",
        "properties": {
            "status": {
                "type": "string",
                "enum": [
                    "considering",
                    "ordered",
                    "in_transit",
                    "received",
                    "cancelled",
                    "returned",
                ],
            },
            "vendor_id": {"type": "integer"},
            "query": {
                "type": "string",
                "description": "Search title, notes, or merchant name.",
            },
        },
        "additionalProperties": False,
    },
    returns="{ items: object[] }",
    executor=execute,
)
