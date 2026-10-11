# stack_sandbox/backend/src/llm/tools/native/focus/create_focus_tag.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import AGENDA
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.focus._focus import dump_model
from modules.focus import service as focus_service
from modules.focus.schemas import FocusTagCreate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Create a focus tag."""
    name = arguments.get("name")
    if not isinstance(name, str) or not name.strip():
        raise AppError("name is required.", status_code=400)
    payload = FocusTagCreate(
        name=name.strip(),
        color_hex=arguments.get("color_hex"),
    )
    created = await focus_service.create_focus_tag(context.user_id, payload)
    return {"tag": dump_model(created)}


TOOL_DEFINITION = ToolDefinition(
    name="create_focus_tag",
    category=AGENDA,
    description="Create a focus tag for categorizing lists.",
    parameters={
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "color_hex": {"type": "string", "description": "Hex color like #06B6D4."},
        },
        "required": ["name"],
        "additionalProperties": False,
    },
    returns="{ tag: object }",
    executor=execute,
)
