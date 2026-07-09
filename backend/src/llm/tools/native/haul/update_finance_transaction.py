# stack_sandbox/backend/src/llm/tools/native/haul/update_shop_item.py

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from core.errors import AppError
from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.haul._haul import dump_model, require_transaction_id
from modules.finance import service as finance_service
from modules.finance.schemas import FinanceTransactionUpdate


def _build_update_payload(arguments: dict[str, Any]) -> FinanceTransactionUpdate:
    """Build a partial FinanceTransactionUpdate from tool arguments."""
    fields: dict[str, Any] = {}
    for key in (
        "title",
        "status",
        "vendor_id",
        "vendor_name",
        "listing_url",
        "notes",
        "currency",
        "quantity",
    ):
        if key in arguments:
            fields[key] = arguments[key]

    if "price_amount" in arguments:
        value = arguments["price_amount"]
        if value is None:
            fields["price_amount"] = None
        elif isinstance(value, (int, float, str)):
            fields["price_amount"] = Decimal(str(value))
        else:
            raise AppError("price_amount must be a number.", status_code=400)

    for date_key in ("ordered_at", "received_at"):
        if date_key in arguments:
            value = arguments[date_key]
            if value is None:
                fields[date_key] = None
            elif isinstance(value, str):
                fields[date_key] = datetime.fromisoformat(value.replace("Z", "+00:00"))
            else:
                raise AppError(f"{date_key} must be an ISO-8601 string.", status_code=400)

    return FinanceTransactionUpdate(**fields)


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update a shop item (partial fields)."""
    transaction_id = require_transaction_id(arguments)
    payload = _build_update_payload(arguments)
    purchase = await finance_service.update_transaction(context.user_id, transaction_id, payload)
    return {"transaction": dump_model(purchase)}


TOOL_DEFINITION = ToolDefinition(
    name="update_finance_transaction",
    category=HAUL,
    description="Update a shop item (partial fields).",
    parameters={
        "type": "object",
        "properties": {
            "transaction_id": {"type": "integer"},
            "title": {"type": "string"},
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
            "vendor_name": {"type": "string"},
            "listing_url": {"type": "string"},
            "notes": {"type": "string"},
            "price_amount": {"type": "number"},
            "currency": {"type": "string"},
            "quantity": {"type": "integer"},
            "ordered_at": {"type": "string"},
            "received_at": {"type": "string"},
        },
        "required": ["transaction_id"],
        "additionalProperties": False,
    },
    returns="{ item: object }",
    executor=execute,
)
