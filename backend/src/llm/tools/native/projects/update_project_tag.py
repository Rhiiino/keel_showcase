# stack_sandbox/backend/src/llm/tools/native/projects/update_project_tag.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PROJECTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.projects._projects import dump_model
from modules.projects import service as projects_service
from modules.projects.schemas import ProjectTagUpdate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update a project tag's name or color."""
    tag_id = arguments.get("tag_id")
    if not isinstance(tag_id, int) or tag_id < 1:
        raise AppError("tag_id must be a positive integer.", status_code=400)

    fields: dict[str, Any] = {}
    if "name" in arguments:
        fields["name"] = arguments["name"]
    if "color_hex" in arguments:
        fields["color_hex"] = arguments["color_hex"]

    if not fields:
        raise AppError("Provide at least one field to update.", status_code=400)

    payload = ProjectTagUpdate(**fields)
    tag = await projects_service.update_project_tag(context.user_id, tag_id, payload)
    return {"tag": dump_model(tag)}


TOOL_DEFINITION = ToolDefinition(
    name="update_project_tag",
    category=PROJECTS,
    description="Update a project tag's name or color.",
    parameters={
        "type": "object",
        "properties": {
            "tag_id": {"type": "integer", "description": "Tag id."},
            "name": {"type": "string"},
            "color_hex": {"type": "string"},
        },
        "required": ["tag_id"],
        "additionalProperties": False,
    },
    returns="{ tag: object }",
    executor=execute,
)
