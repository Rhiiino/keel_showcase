# stack_sandbox/backend/src/llm/tools/native/focus/delete_focus_list.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import AGENDA
from llm.tools.contracts import ToolContext, ToolDefinition
from modules.focus import service as focus_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Delete a focus list."""
    list_id = arguments.get("list_id")
    if not isinstance(list_id, int) or list_id < 1:
        raise AppError("list_id must be a positive integer.", status_code=400)
    await focus_service.delete_focus_list(context.user_id, list_id)
    return {"deleted": True, "list_id": list_id}


TOOL_DEFINITION = ToolDefinition(
    name="delete_focus_list",
    category=AGENDA,
    description="Delete a focus list and all items in it.",
    parameters={
        "type": "object",
        "properties": {
            "list_id": {"type": "integer"},
        },
        "required": ["list_id"],
        "additionalProperties": False,
    },
    returns="{ deleted: boolean, list_id: integer }",
    executor=execute,
)
