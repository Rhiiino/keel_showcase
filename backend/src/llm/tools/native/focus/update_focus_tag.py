# stack_sandbox/backend/src/llm/tools/native/focus/update_focus_tag.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import AGENDA
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.focus._focus import dump_model
from modules.focus import service as focus_service
from modules.focus.schemas import FocusTagUpdate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update a focus tag."""
    tag_id = arguments.get("tag_id")
    if not isinstance(tag_id, int) or tag_id < 1:
        raise AppError("tag_id must be a positive integer.", status_code=400)
    payload = FocusTagUpdate(
        name=arguments.get("name"),
        color_hex=arguments.get("color_hex"),
    )
    updated = await focus_service.update_focus_tag(context.user_id, tag_id, payload)
    return {"tag": dump_model(updated)}


TOOL_DEFINITION = ToolDefinition(
    name="update_focus_tag",
    category=AGENDA,
    description="Update a focus tag name or color.",
    parameters={
        "type": "object",
        "properties": {
            "tag_id": {"type": "integer"},
            "name": {"type": "string"},
            "color_hex": {"type": "string"},
        },
        "required": ["tag_id"],
        "additionalProperties": False,
    },
    returns="{ tag: object }",
    executor=execute,
)
