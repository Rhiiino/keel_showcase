# stack_sandbox/backend/src/llm/tools/native/projects/update_project.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PROJECTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.projects._projects import dump_model
from modules.projects import service as projects_service
from modules.projects.schemas import ProjectUpdate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update project metadata (title, description, status, kind, tag_ids)."""
    project_id = arguments.get("project_id")
    if not isinstance(project_id, int) or project_id < 1:
        raise AppError("project_id must be a positive integer.", status_code=400)

    fields: dict[str, Any] = {}
    for key in ("title", "description", "status", "kind", "tag_ids"):
        if key in arguments:
            fields[key] = arguments[key]

    if not fields:
        raise AppError("Provide at least one field to update.", status_code=400)

    payload = ProjectUpdate(**fields)
    project = await projects_service.update_project(context.user_id, project_id, payload)
    return {"project": dump_model(project)}


TOOL_DEFINITION = ToolDefinition(
    name="update_project",
    category=PROJECTS,
    description="Update project metadata (title, description, status, kind, tag_ids).",
    parameters={
        "type": "object",
        "properties": {
            "project_id": {"type": "integer", "description": "Project id."},
            "title": {"type": "string"},
            "description": {"type": "string"},
            "status": {
                "type": "string",
                "enum": ["planning", "active", "paused", "completed", "archived"],
            },
            "kind": {"type": "string"},
            "tag_ids": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "Replace all tag assignments with this list.",
            },
        },
        "required": ["project_id"],
        "additionalProperties": False,
    },
    returns="{ project: object }",
    executor=execute,
)
