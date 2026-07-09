# stack_sandbox/backend/src/llm/tools/native/focus/list_focus_entries.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import AGENDA
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.focus._focus import dump_models
from modules.focus import service as focus_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List focus entries with optional filters."""
    list_id = arguments.get("list_id")
    status = arguments.get("status")
    kind = arguments.get("kind")
    entries = await focus_service.list_focus_entries(
        context.user_id,
        list_id=list_id if isinstance(list_id, int) else None,
        status=str(status) if isinstance(status, str) else None,
        kind=str(kind) if isinstance(kind, str) else None,
    )
    return {"entries": dump_models(entries), "count": len(entries)}


TOOL_DEFINITION = ToolDefinition(
    name="list_focus_entries",
    category=AGENDA,
    description="List focus entries. Filter by list, status, or kind (task or list_link).",
    parameters={
        "type": "object",
        "properties": {
            "list_id": {"type": "integer", "description": "Filter to one list."},
            "status": {
                "type": "string",
                "enum": ["active", "completed", "archived"],
            },
            "kind": {
                "type": "string",
                "enum": ["task", "list_link"],
            },
        },
        "additionalProperties": False,
    },
    returns="{ entries: array, count: integer }",
    executor=execute,
)
