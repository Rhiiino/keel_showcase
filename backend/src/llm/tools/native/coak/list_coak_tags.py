# keel_api/src/llm/tools/native/coak/list_coak_tags.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import dump_models, require_record_id
from modules.coak.service import tags as tags_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List tags for a Coak record."""
    record_id = require_record_id(arguments)
    tags = await tags_service.list_tags(context.user_id, record_id)
    return {"tags": dump_models(tags), "count": len(tags)}


TOOL_DEFINITION = ToolDefinition(
    name="list_coak_tags",
    category=COAK,
    description="List tags defined for a Coak record.",
    parameters={
        "type": "object",
        "properties": {
            "record_id": {"type": "integer"},
        },
        "required": ["record_id"],
        "additionalProperties": False,
    },
    returns="{ tags: array, count: integer }",
    executor=execute,
)
