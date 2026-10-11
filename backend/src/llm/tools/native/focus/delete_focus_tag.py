# stack_sandbox/backend/src/llm/tools/native/focus/delete_focus_tag.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import AGENDA
from llm.tools.contracts import ToolContext, ToolDefinition
from modules.focus import service as focus_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Delete a focus tag."""
    tag_id = arguments.get("tag_id")
    if not isinstance(tag_id, int) or tag_id < 1:
        raise AppError("tag_id must be a positive integer.", status_code=400)
    await focus_service.delete_focus_tag(context.user_id, tag_id)
    return {"deleted": True, "tag_id": tag_id}


TOOL_DEFINITION = ToolDefinition(
    name="delete_focus_tag",
    category=AGENDA,
    description="Delete a focus tag.",
    parameters={
        "type": "object",
        "properties": {
            "tag_id": {"type": "integer"},
        },
        "required": ["tag_id"],
        "additionalProperties": False,
    },
    returns="{ deleted: boolean, tag_id: integer }",
    executor=execute,
)
