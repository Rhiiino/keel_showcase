# keel_api/src/llm/tools/native/coak/list_coak_items.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import dump_models, require_record_id
from modules.coak.service import items as items_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List all items in a Coak record."""
    record_id = require_record_id(arguments)
    items = await items_service.list_items(context.user_id, record_id)
    return {"items": dump_models(items), "count": len(items)}


TOOL_DEFINITION = ToolDefinition(
    name="list_coak_items",
    category=COAK,
    description="List all directory items in a Coak record, including embedded tags.",
    parameters={
        "type": "object",
        "properties": {
            "record_id": {
                "type": "integer",
                "description": "Coak record id.",
            },
        },
        "required": ["record_id"],
        "additionalProperties": False,
    },
    returns="{ items: array, count: integer }",
    executor=execute,
)
