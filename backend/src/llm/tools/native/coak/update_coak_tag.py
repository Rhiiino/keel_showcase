# keel_api/src/llm/tools/native/coak/update_coak_tag.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import dump_model, require_record_id, require_tag_id
from modules.coak.schemas import CoakTagUpdate
from modules.coak.service import tags as tags_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update a Coak tag."""
    record_id = require_record_id(arguments)
    tag_id = require_tag_id(arguments)
    payload = CoakTagUpdate(
        **{
            key: arguments[key]
            for key in ("name", "description", "color_hex")
            if key in arguments
        }
    )
    updated = await tags_service.update_tag(context.user_id, record_id, tag_id, payload)
    return {"tag": dump_model(updated)}


TOOL_DEFINITION = ToolDefinition(
    name="update_coak_tag",
    category=COAK,
    description="Update a Coak tag name, description, or color.",
    parameters={
        "type": "object",
        "properties": {
            "record_id": {"type": "integer"},
            "tag_id": {"type": "integer"},
            "name": {"type": "string"},
            "description": {"type": ["string", "null"]},
            "color_hex": {"type": ["string", "null"]},
        },
        "required": ["record_id", "tag_id"],
        "additionalProperties": False,
    },
    returns="{ tag: object }",
    executor=execute,
)
