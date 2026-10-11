# keel_api/src/llm/tools/native/coak/create_coak_tag.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import dump_model, require_record_id
from modules.coak.schemas import CoakTagCreate
from modules.coak.service import tags as tags_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Create a tag in a Coak record."""
    record_id = require_record_id(arguments)
    name = arguments.get("name")
    if not isinstance(name, str) or not name.strip():
        raise AppError("name is required.", status_code=400)
    payload = CoakTagCreate(
        name=name.strip(),
        description=arguments.get("description"),
        color_hex=arguments.get("color_hex"),
    )
    created = await tags_service.create_tag(context.user_id, record_id, payload)
    return {"tag": dump_model(created)}


TOOL_DEFINITION = ToolDefinition(
    name="create_coak_tag",
    category=COAK,
    description="Create a tag in a Coak record for categorizing items.",
    parameters={
        "type": "object",
        "properties": {
            "record_id": {"type": "integer"},
            "name": {"type": "string"},
            "description": {"type": ["string", "null"]},
            "color_hex": {
                "type": ["string", "null"],
                "description": "Hex color like #06B6D4.",
            },
        },
        "required": ["record_id", "name"],
        "additionalProperties": False,
    },
    returns="{ tag: object }",
    executor=execute,
)
