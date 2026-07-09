# stack_sandbox/backend/src/llm/tools/native/projects/get_project.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PROJECTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.projects._projects import dump_model
from modules.projects import service as projects_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Get full details for one project by id."""
    project_id = arguments.get("project_id")
    if not isinstance(project_id, int) or project_id < 1:
        raise AppError("project_id must be a positive integer.", status_code=400)
    project = await projects_service.get_project(context.user_id, project_id)
    return {"project": dump_model(project)}


TOOL_DEFINITION = ToolDefinition(
    name="get_project",
    category=PROJECTS,
    description="Get full details for one project by id.",
    parameters={
        "type": "object",
        "properties": {
            "project_id": {"type": "integer", "description": "Project id."},
        },
        "required": ["project_id"],
        "additionalProperties": False,
    },
    returns="{ project: object }",
    executor=execute,
)
