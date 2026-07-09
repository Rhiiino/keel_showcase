# stack_sandbox/backend/src/llm/tools/native/haul/delete_shop_merchant.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.haul._haul import require_vendor_id
from modules.finance import service as finance_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Delete a shop merchant (items keep but lose merchant link)."""
    vendor_id = require_vendor_id(arguments)
    await finance_service.delete_vendor(context.user_id, vendor_id)
    return {"deleted": True, "vendor_id": vendor_id}


TOOL_DEFINITION = ToolDefinition(
    name="delete_finance_vendor",
    category=HAUL,
    description="Delete a shop merchant (items keep but lose merchant link).",
    parameters={
        "type": "object",
        "properties": {
            "vendor_id": {"type": "integer", "description": "Merchant id."},
        },
        "required": ["vendor_id"],
        "additionalProperties": False,
    },
    returns="{ deleted: boolean, vendor_id: number }",
    executor=execute,
)
