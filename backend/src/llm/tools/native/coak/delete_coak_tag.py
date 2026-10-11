# keel_api/src/llm/tools/native/coak/delete_coak_tag.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import require_record_id, require_tag_id
from modules.coak.service import tags as tags_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Delete a Coak tag."""
    record_id = require_record_id(arguments)
    tag_id = require_tag_id(arguments)
    await tags_service.delete_tag(context.user_id, record_id, tag_id)
    return {"deleted": True, "record_id": record_id, "tag_id": tag_id}


TOOL_DEFINITION = ToolDefinition(
    name="delete_coak_tag",
    category=COAK,
    description="Delete a Coak tag and move it to trash.",
    parameters={
        "type": "object",
        "properties": {
            "record_id": {"type": "integer"},
            "tag_id": {"type": "integer"},
        },
        "required": ["record_id", "tag_id"],
        "additionalProperties": False,
    },
    returns="{ deleted: boolean, record_id: integer, tag_id: integer }",
    executor=execute,
)
