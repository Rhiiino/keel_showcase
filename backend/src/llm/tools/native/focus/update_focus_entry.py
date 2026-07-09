# keel_api/src/llm/tools/native/focus/update_focus_entry.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import AGENDA
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.focus._focus import dump_model
from modules.focus import service as focus_service
from modules.focus.schemas import FocusEntryUpdate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update a focus entry."""
    entry_id = arguments.get("entry_id")
    if not isinstance(entry_id, int) or entry_id < 1:
        raise AppError("entry_id must be a positive integer.", status_code=400)
    payload = FocusEntryUpdate(
        **{
            key: arguments[key]
            for key in (
                "title",
                "notes",
                "list_id",
                "status",
                "sort_order",
            )
            if key in arguments
        }
    )
    updated = await focus_service.update_focus_entry(context.user_id, entry_id, payload)
    return {"entry": dump_model(updated)}


TOOL_DEFINITION = ToolDefinition(
    name="update_focus_entry",
    category=AGENDA,
    description="Update a task focus entry, including moving between lists or completing it.",
    parameters={
        "type": "object",
        "properties": {
            "entry_id": {"type": "integer"},
            "title": {"type": "string"},
            "notes": {"type": "string"},
            "list_id": {
                "type": "integer",
                "description": "Move the entry to another list.",
            },
            "status": {
                "type": "string",
                "enum": ["active", "completed", "archived"],
            },
            "sort_order": {"type": "integer"},
        },
        "required": ["entry_id"],
        "additionalProperties": False,
    },
    returns="{ entry: object }",
    executor=execute,
)
