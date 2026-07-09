# stack_sandbox/backend/src/llm/tools/native/projects/delete_project.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PROJECTS
from llm.tools.contracts import ToolContext, ToolDefinition
from modules.projects import service as projects_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Permanently delete a project and its media files."""
    project_id = arguments.get("project_id")
    if not isinstance(project_id, int) or project_id < 1:
        raise AppError("project_id must be a positive integer.", status_code=400)
    await projects_service.delete_project(context.user_id, project_id)
    return {"deleted": True, "project_id": project_id}


TOOL_DEFINITION = ToolDefinition(
    name="delete_project",
    category=PROJECTS,
    description="Permanently delete a project and its media files.",
    parameters={
        "type": "object",
        "properties": {
            "project_id": {"type": "integer", "description": "Project id."},
        },
        "required": ["project_id"],
        "additionalProperties": False,
    },
    returns="{ deleted: boolean, project_id: integer }",
    executor=execute,
)
