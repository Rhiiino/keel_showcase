# stack_sandbox/backend/src/llm/tools/native/haul/set_shop_item_cover_from_url.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.haul._haul import dump_model, require_transaction_id
from modules.finance import service as finance_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Download an image from a URL and set it as the shop item's cover image."""
    transaction_id = require_transaction_id(arguments)
    image_url = arguments.get("image_url")
    if not isinstance(image_url, str) or not image_url.strip():
        raise AppError("image_url is required.", status_code=400)
    purchase = await finance_service.set_transaction_cover_from_url(
        context.user_id,
        transaction_id,
        image_url=image_url.strip(),
    )
    return {"transaction": dump_model(purchase)}


TOOL_DEFINITION = ToolDefinition(
    name="set_finance_transaction_cover_from_url",
    category=HAUL,
    description=(
        "Download an image from a URL and set it as the shop item's cover image."
    ),
    parameters={
        "type": "object",
        "properties": {
            "transaction_id": {"type": "integer"},
            "image_url": {
                "type": "string",
                "description": "Absolute http(s) URL of the product image.",
            },
        },
        "required": ["transaction_id", "image_url"],
        "additionalProperties": False,
    },
    returns="{ item: object }",
    executor=execute,
)
