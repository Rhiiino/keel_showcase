# stack_sandbox/backend/src/llm/tools/native/focus/get_focus_list.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import AGENDA
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.focus._focus import dump_model
from modules.focus import service as focus_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Fetch one focus list with its entries."""
    list_id = arguments.get("list_id")
    if not isinstance(list_id, int) or list_id < 1:
        raise AppError("list_id must be a positive integer.", status_code=400)
    detail = await focus_service.get_focus_list(context.user_id, list_id)
    return {"list": dump_model(detail)}


TOOL_DEFINITION = ToolDefinition(
    name="get_focus_list",
    category=AGENDA,
    description="Fetch one focus list with embedded entries.",
    parameters={
        "type": "object",
        "properties": {
            "list_id": {"type": "integer", "description": "Focus list id."},
        },
        "required": ["list_id"],
        "additionalProperties": False,
    },
    returns="{ list: object }",
    executor=execute,
)
