# keel_api/src/llm/tools/native/focus/create_focus_entry.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import AGENDA
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.focus._focus import dump_model
from modules.focus import service as focus_service
from modules.focus.schemas import FocusEntryCreate, FocusLinkedListCreateInline


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Create a focus entry in a list."""
    title = arguments.get("title")
    if not isinstance(title, str) or not title.strip():
        raise AppError("title is required.", status_code=400)
    list_id = arguments.get("list_id")
    if not isinstance(list_id, int) or list_id < 1:
        raise AppError("list_id must be a positive integer.", status_code=400)

    linked_list = None
    raw_linked_list = arguments.get("linked_list")
    if isinstance(raw_linked_list, dict):
        linked_list = FocusLinkedListCreateInline(
            notes=str(raw_linked_list.get("notes") or ""),
            node_color_hex=raw_linked_list.get("node_color_hex"),
            title_font_key=raw_linked_list.get("title_font_key"),
            tag_ids=raw_linked_list.get("tag_ids"),
        )

    payload = FocusEntryCreate(
        title=title.strip(),
        notes=str(arguments.get("notes") or ""),
        list_id=list_id,
        kind=str(arguments.get("kind") or "task"),
        status=str(arguments.get("status") or "active"),
        linked_list_id=(
            arguments.get("linked_list_id")
            if isinstance(arguments.get("linked_list_id"), int)
            else None
        ),
        linked_list=linked_list,
    )
    created = await focus_service.create_focus_entry(context.user_id, payload)
    return {"entry": dump_model(created)}


TOOL_DEFINITION = ToolDefinition(
    name="create_focus_entry",
    category=AGENDA,
    description="Create a focus entry in a list (task or list_link).",
    parameters={
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "notes": {"type": "string"},
            "list_id": {
                "type": "integer",
                "description": "Target list id.",
            },
            "kind": {
                "type": "string",
                "enum": ["task", "list_link"],
                "description": "Entry kind. Defaults to task.",
            },
            "linked_list_id": {
                "type": "integer",
                "description": "Existing list id for list_link entries.",
            },
            "linked_list": {
                "type": "object",
                "description": "Inline list fields when creating a new linked list.",
                "properties": {
                    "notes": {"type": "string"},
                    "node_color_hex": {"type": ["string", "null"]},
                    "title_font_key": {"type": ["string", "null"]},
                    "tag_ids": {
                        "type": "array",
                        "items": {"type": "integer"},
                    },
                },
            },
            "status": {
                "type": "string",
                "enum": ["active", "completed", "archived"],
            },
        },
        "required": ["title", "list_id"],
        "additionalProperties": False,
    },
    returns="{ entry: object }",
    executor=execute,
)
