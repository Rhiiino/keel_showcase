# stack_sandbox/backend/src/llm/tools/native/focus/delete_focus_entry.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import AGENDA
from llm.tools.contracts import ToolContext, ToolDefinition
from modules.focus import service as focus_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Delete a focus entry."""
    entry_id = arguments.get("entry_id")
    if not isinstance(entry_id, int) or entry_id < 1:
        raise AppError("entry_id must be a positive integer.", status_code=400)
    await focus_service.delete_focus_entry(context.user_id, entry_id)
    return {"deleted": True, "entry_id": entry_id}


TOOL_DEFINITION = ToolDefinition(
    name="delete_focus_entry",
    category=AGENDA,
    description="Delete a focus entry.",
    parameters={
        "type": "object",
        "properties": {
            "entry_id": {"type": "integer"},
        },
        "required": ["entry_id"],
        "additionalProperties": False,
    },
    returns="{ deleted: boolean, entry_id: integer }",
    executor=execute,
)
