# keel_api/src/llm/tools/native/coak/delete_coak_item.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import require_item_id, require_record_id
from modules.coak.service import items as items_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Delete a Coak directory item."""
    record_id = require_record_id(arguments)
    item_id = require_item_id(arguments)
    await items_service.delete_item(context.user_id, record_id, item_id)
    return {"deleted": True, "record_id": record_id, "item_id": item_id}


TOOL_DEFINITION = ToolDefinition(
    name="delete_coak_item",
    category=COAK,
    description="Delete a Coak directory item and its descendants.",
    parameters={
        "type": "object",
        "properties": {
            "record_id": {"type": "integer"},
            "item_id": {"type": "integer"},
        },
        "required": ["record_id", "item_id"],
        "additionalProperties": False,
    },
    returns="{ deleted: boolean, record_id: integer, item_id: integer }",
    executor=execute,
)
