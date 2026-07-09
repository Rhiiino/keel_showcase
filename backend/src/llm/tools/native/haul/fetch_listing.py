# stack_sandbox/backend/src/llm/tools/native/haul/fetch_listing.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from modules.finance.listing import service as listing_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Fetch and parse a product listing URL (e-commerce page). Returns title, price, currency, image_url, vendor_name, description, found_fields, blocked, and partial flags. Use before create_shop_item to import from a link; merge with any fields the user provided (user values win)."""
    del context
    url = arguments.get("url")
    if not isinstance(url, str) or not url.strip():
        raise AppError("url is required.", status_code=400)
    listing = await listing_service.fetch_listing(url.strip())
    return {"listing": listing}


TOOL_DEFINITION = ToolDefinition(
    name="fetch_listing",
    category=HAUL,
    description=(
        "Fetch and parse a product listing URL (e-commerce page). Returns title, "
        "price, currency, image_url, vendor_name, description, found_fields, "
        "blocked, and partial flags. Use before create_shop_item to import from a link; "
        "merge with any fields the user provided (user values win)."
    ),
    parameters={
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "Product listing URL (http or https).",
            },
        },
        "required": ["url"],
        "additionalProperties": False,
    },
    returns=(
        "{ listing: { title, price_amount, currency, image_url, vendor_name, "
        "description, found_fields, blocked, partial, final_url? } }"
    ),
    executor=execute,
)
