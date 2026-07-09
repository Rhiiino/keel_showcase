# stack_sandbox/backend/src/llm/tools/native/haul/create_shop_item.py

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from core.errors import AppError
from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.haul._haul import dump_model
from modules.finance import service as finance_service
from modules.finance.schemas import FinanceTransactionCreate


def _optional_decimal(value: object) -> Decimal | None:
    """Parse an optional price amount from tool arguments."""
    if value is None:
        return None
    if isinstance(value, (int, float, str)):
        return Decimal(str(value))
    raise AppError("price_amount must be a number.", status_code=400)


def _optional_datetime(value: object) -> datetime | None:
    """Parse an optional ISO-8601 datetime from tool arguments."""
    if value is None:
        return None
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    raise AppError("Date fields must be ISO-8601 strings.", status_code=400)


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Create a shop item (purchase, wishlist entry, or order)."""
    title = arguments.get("title")
    if not isinstance(title, str) or not title.strip():
        raise AppError("title is required.", status_code=400)
    payload = FinanceTransactionCreate(
        title=title.strip(),
        status=str(arguments.get("status") or "considering"),
        vendor_id=arguments.get("vendor_id"),
        vendor_name=arguments.get("vendor_name"),
        listing_url=arguments.get("listing_url"),
        notes=str(arguments.get("notes") or ""),
        price_amount=_optional_decimal(arguments.get("price_amount")),
        currency=arguments.get("currency"),
        quantity=arguments.get("quantity"),
        ordered_at=_optional_datetime(arguments.get("ordered_at")),
        received_at=_optional_datetime(arguments.get("received_at")),
    )
    transaction = await finance_service.create_transaction(context.user_id, payload)
    return {"transaction": dump_model(transaction)}


TOOL_DEFINITION = ToolDefinition(
    name="create_finance_transaction",
    category=HAUL,
    description="Create a shop item (purchase, wishlist entry, or order).",
    parameters={
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "Item name."},
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
            "vendor_name": {
                "type": "string",
                "description": "Find-or-create merchant by name.",
            },
            "listing_url": {"type": "string"},
            "notes": {"type": "string"},
            "price_amount": {"type": "number"},
            "currency": {"type": "string"},
            "quantity": {"type": "integer"},
            "ordered_at": {"type": "string", "description": "ISO-8601 timestamp."},
            "received_at": {"type": "string", "description": "ISO-8601 timestamp."},
        },
        "required": ["title"],
        "additionalProperties": False,
    },
    returns="{ item: object }",
    executor=execute,
)
