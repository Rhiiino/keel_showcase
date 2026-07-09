# stack_sandbox/backend/src/llm/tools/native/haul/update_shop_merchant.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.haul._haul import dump_model, require_vendor_id
from modules.finance import service as finance_service
from modules.finance.schemas import FinanceVendorUpdate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update a shop merchant."""
    vendor_id = require_vendor_id(arguments)
    payload = FinanceVendorUpdate(
        name=arguments.get("name"),
        website_url=arguments.get("website_url"),
        notes=arguments.get("notes"),
        default_currency=arguments.get("default_currency"),
    )
    vendor = await finance_service.update_vendor(
        context.user_id,
        vendor_id,
        payload,
    )
    return {"vendor": dump_model(merchant)}


TOOL_DEFINITION = ToolDefinition(
    name="update_finance_vendor",
    category=HAUL,
    description="Update a shop merchant.",
    parameters={
        "type": "object",
        "properties": {
            "vendor_id": {"type": "integer", "description": "Merchant id."},
            "name": {"type": "string"},
            "website_url": {"type": "string"},
            "notes": {"type": "string"},
            "default_currency": {"type": "string"},
        },
        "required": ["vendor_id"],
        "additionalProperties": False,
    },
    returns="{ merchant: object }",
    executor=execute,
)
