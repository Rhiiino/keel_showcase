# stack_sandbox/backend/src/llm/tools/native/haul/create_shop_merchant.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.haul._haul import dump_model
from modules.finance import service as finance_service
from modules.finance.schemas import FinanceVendorCreate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Create a shop merchant."""
    name = arguments.get("name")
    if not isinstance(name, str) or not name.strip():
        raise AppError("name is required.", status_code=400)
    payload = FinanceVendorCreate(
        name=name.strip(),
        website_url=arguments.get("website_url"),
        notes=str(arguments.get("notes") or ""),
        default_currency=arguments.get("default_currency"),
    )
    vendor = await finance_service.create_vendor(context.user_id, payload)
    return {"vendor": dump_model(merchant)}


TOOL_DEFINITION = ToolDefinition(
    name="create_finance_vendor",
    category=HAUL,
    description="Create a shop merchant.",
    parameters={
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Merchant name."},
            "website_url": {"type": "string", "description": "Optional website URL."},
            "notes": {"type": "string", "description": "Optional notes."},
            "default_currency": {
                "type": "string",
                "description": "Optional default currency code.",
            },
        },
        "required": ["name"],
        "additionalProperties": False,
    },
    returns="{ merchant: object }",
    executor=execute,
)
