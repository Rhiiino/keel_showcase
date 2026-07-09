# keel_api/src/llm/tools/native/focus/update_focus_list.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import AGENDA
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.focus._focus import dump_model
from modules.focus import service as focus_service
from modules.focus.schemas import FocusListUpdate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update a focus list."""
    list_id = arguments.get("list_id")
    if not isinstance(list_id, int) or list_id < 1:
        raise AppError("list_id must be a positive integer.", status_code=400)
    tag_ids = arguments.get("tag_ids")
    payload_kwargs: dict[str, object] = {
        "title": arguments.get("title"),
        "notes": arguments.get("notes"),
        "status": arguments.get("status"),
        "sort_order": arguments.get("sort_order"),
        "tag_ids": tag_ids if isinstance(tag_ids, list) else None,
    }
    if "node_color_hex" in arguments:
        payload_kwargs["node_color_hex"] = arguments.get("node_color_hex")
    if "title_font_key" in arguments:
        payload_kwargs["title_font_key"] = arguments.get("title_font_key")
    payload = FocusListUpdate(**payload_kwargs)
    updated = await focus_service.update_focus_list(context.user_id, list_id, payload)
    return {"list": dump_model(updated)}


TOOL_DEFINITION = ToolDefinition(
    name="update_focus_list",
    category=AGENDA,
    description=(
        "Update a focus list title, notes, status, sort order, node color, "
        "title font, or tags."
    ),
    parameters={
        "type": "object",
        "properties": {
            "list_id": {"type": "integer"},
            "title": {"type": "string"},
            "notes": {"type": "string"},
            "status": {"type": "string", "enum": ["active", "archived"]},
            "sort_order": {"type": "integer"},
            "tag_ids": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "Replace list tag assignments when provided.",
            },
            "node_color_hex": {
                "type": ["string", "null"],
                "description": "Node tint hex; null clears to default.",
            },
            "title_font_key": {
                "type": ["string", "null"],
                "description": "Title font key; null clears to default.",
            },
        },
        "required": ["list_id"],
        "additionalProperties": False,
    },
    returns="{ list: object }",
    executor=execute,
)
