# stack_sandbox/backend/src/llm/tools/native/projects/create_project_tag.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PROJECTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.projects._projects import dump_model
from modules.projects import service as projects_service
from modules.projects.schemas import ProjectTagCreate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Create a new project tag."""
    name = arguments.get("name")
    if not isinstance(name, str) or not name.strip():
        raise AppError("name is required.", status_code=400)
    payload = ProjectTagCreate(
        name=name.strip(),
        color_hex=arguments.get("color_hex"),
    )
    tag = await projects_service.create_project_tag(context.user_id, payload)
    return {"tag": dump_model(tag)}


TOOL_DEFINITION = ToolDefinition(
    name="create_project_tag",
    category=PROJECTS,
    description="Create a new project tag.",
    parameters={
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Tag name."},
            "color_hex": {
                "type": "string",
                "description": "Optional hex color, e.g. #06B6D4.",
            },
        },
        "required": ["name"],
        "additionalProperties": False,
    },
    returns="{ tag: object }",
    executor=execute,
)
