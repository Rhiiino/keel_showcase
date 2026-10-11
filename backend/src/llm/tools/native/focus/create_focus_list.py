# keel_api/src/llm/tools/native/focus/create_focus_list.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import AGENDA
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.focus._focus import dump_model
from modules.focus import service as focus_service
from modules.focus.schemas import FocusListCreate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Create a new focus list."""
    title = arguments.get("title")
    if not isinstance(title, str) or not title.strip():
        raise AppError("title is required.", status_code=400)
    tag_ids = arguments.get("tag_ids")
    payload_kwargs: dict[str, object] = {
        "title": title.strip(),
        "notes": str(arguments.get("notes") or ""),
        "status": str(arguments.get("status") or "active"),
        "tag_ids": tag_ids if isinstance(tag_ids, list) else None,
    }
    if "node_color_hex" in arguments:
        node_color_hex = arguments.get("node_color_hex")
        payload_kwargs["node_color_hex"] = (
            str(node_color_hex) if isinstance(node_color_hex, str) else None
        )
    if "title_font_key" in arguments:
        title_font_key = arguments.get("title_font_key")
        payload_kwargs["title_font_key"] = (
            str(title_font_key) if isinstance(title_font_key, str) else None
        )
    payload = FocusListCreate(**payload_kwargs)
    created = await focus_service.create_focus_list(context.user_id, payload)
    return {"list": dump_model(created)}


TOOL_DEFINITION = ToolDefinition(
    name="create_focus_list",
    category=AGENDA,
    description="Create a new focus list.",
    parameters={
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "List title."},
            "notes": {"type": "string", "description": "Optional notes."},
            "status": {
                "type": "string",
                "enum": ["active", "archived"],
                "description": "Defaults to active.",
            },
            "tag_ids": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "Optional tag ids to assign to the list.",
            },
            "node_color_hex": {
                "type": ["string", "null"],
                "description": "Optional node tint hex like #38BDF8.",
            },
            "title_font_key": {
                "type": ["string", "null"],
                "description": (
                    "Optional title font key (default, serif, mono, rounded, "
                    "condensed, handwritten, display, elegant, slab, bold, "
                    "retro, tech, classic, wide)."
                ),
            },
        },
        "required": ["title"],
        "additionalProperties": False,
    },
    returns="{ list: object }",
    executor=execute,
)
