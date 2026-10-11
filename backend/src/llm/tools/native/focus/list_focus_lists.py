# stack_sandbox/backend/src/llm/tools/native/focus/list_focus_lists.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import AGENDA
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.focus._focus import dump_models
from modules.focus import service as focus_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List focus lists for the user."""
    status = arguments.get("status")
    lists = await focus_service.list_focus_lists(
        context.user_id,
        status=str(status) if isinstance(status, str) else None,
    )
    return {"lists": dump_models(lists), "count": len(lists)}


TOOL_DEFINITION = ToolDefinition(
    name="list_focus_lists",
    category=AGENDA,
    description="List the user's focus lists (named task containers).",
    parameters={
        "type": "object",
        "properties": {
            "status": {
                "type": "string",
                "enum": ["active", "archived"],
                "description": "Optional status filter.",
            },
        },
        "additionalProperties": False,
    },
    returns="{ lists: array, count: integer }",
    executor=execute,
)
