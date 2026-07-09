# stack_sandbox/backend/src/llm/tools/native/haul/propose_shop_listing.py

from __future__ import annotations

import json
from decimal import Decimal
from typing import Any

from core.errors import AppError
from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from modules.finance import service as finance_service


def _optional_decimal(value: object) -> Decimal | None:
    """Parse an optional price amount from tool arguments."""
    if value is None:
        return None
    if isinstance(value, (int, float, str)):
        return Decimal(str(value))
    raise AppError("price_amount must be a number.", status_code=400)


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Propose a new shop item from listing data WITHOUT writing to the database. Use after fetch_listing when the user wants to add a product — merge user-provided fields (user values win). Include the returned proposal_card_markdown in your reply. Wait for the user to Confirm or Decline in the chat UI before calling create_shop_item."""
    title = arguments.get("title")
    if not isinstance(title, str) or not title.strip():
        raise AppError("title is required.", status_code=400)

    item: dict[str, Any] = {
        "title": title.strip(),
        "status": str(arguments.get("status") or "considering"),
        "vendor_id": arguments.get("vendor_id"),
        "vendor_name": arguments.get("vendor_name"),
        "listing_url": arguments.get("listing_url"),
        "notes": str(arguments.get("notes") or ""),
        "currency": arguments.get("currency") or "USD",
        "quantity": arguments.get("quantity") if arguments.get("quantity") is not None else 1,
    }
    price = _optional_decimal(arguments.get("price_amount"))
    if price is not None:
        item["price_amount"] = str(price)

    payload: dict[str, Any] = {"purchase": item}
    image_url = arguments.get("image_url")
    if isinstance(image_url, str) and image_url.strip():
        payload["image_url"] = image_url.strip()

    proposal, card = await finance_service.create_listing_proposal(
        context.user_id,
        conversation_id=context.conversation_id,
        payload=payload,
    )
    return {
        "proposal_id": proposal.id,
        "status": proposal.status,
        "proposal_card": card,
        "proposal_card_markdown": (
            "Show the user this proposal (they must Confirm or Decline in chat):\n\n"
            f"```keel:proposal\n{json.dumps(card, indent=2)}\n```"
        ),
    }


TOOL_DEFINITION = ToolDefinition(
    name="propose_finance_listing",
    category=HAUL,
    description=(
        "Propose a new shop item from listing data WITHOUT writing to the database. "
        "Use after fetch_listing when the user wants to add a product — merge user-provided "
        "fields (user values win). Include the returned proposal_card_markdown in your reply. "
        "Wait for the user to Confirm or Decline in the chat UI before calling create_shop_item."
    ),
    parameters={
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "status": {
                "type": "string",
                "description": "considering, ordered, in_transit, received, cancelled, returned",
            },
            "vendor_id": {"type": "integer"},
            "vendor_name": {"type": "string"},
            "listing_url": {"type": "string"},
            "notes": {"type": "string"},
            "price_amount": {"type": "number"},
            "currency": {"type": "string"},
            "quantity": {"type": "integer"},
            "image_url": {
                "type": "string",
                "description": "Product image URL from the listing.",
            },
        },
        "required": ["title"],
        "additionalProperties": False,
    },
    returns=(
        "{ proposal_id, status, proposal_card, proposal_card_markdown } — user must "
        "confirm in chat before the item exists."
    ),
    executor=execute,
)
