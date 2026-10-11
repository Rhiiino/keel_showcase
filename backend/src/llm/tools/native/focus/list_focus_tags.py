# stack_sandbox/backend/src/llm/tools/native/focus/list_focus_tags.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import AGENDA
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.focus._focus import dump_models
from modules.focus import service as focus_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List focus tags for the user."""
    del arguments
    tags = await focus_service.list_focus_tags(context.user_id)
    return {"tags": dump_models(tags), "count": len(tags)}


TOOL_DEFINITION = ToolDefinition(
    name="list_focus_tags",
    category=AGENDA,
    description="List the user's focus tags.",
    parameters={"type": "object", "properties": {}, "additionalProperties": False},
    returns="{ tags: array, count: integer }",
    executor=execute,
)
