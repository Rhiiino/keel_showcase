# stack_sandbox/backend/src/llm/tools/native/projects/create_project.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PROJECTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.projects._projects import dump_model
from modules.projects import service as projects_service
from modules.projects.schemas import ProjectCreate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Create a new personal project."""
    title = arguments.get("title")
    if not isinstance(title, str) or not title.strip():
        raise AppError("title is required.", status_code=400)
    payload = ProjectCreate(
        title=title.strip(),
        description=str(arguments.get("description") or ""),
        status=str(arguments.get("status") or "planning"),
        kind=arguments.get("kind"),
    )
    project = await projects_service.create_project(context.user_id, payload)
    return {"project": dump_model(project)}


TOOL_DEFINITION = ToolDefinition(
    name="create_project",
    category=PROJECTS,
    description="Create a new personal project.",
    parameters={
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "Project title."},
            "description": {"type": "string", "description": "Optional description."},
            "status": {
                "type": "string",
                "enum": ["planning", "active", "paused", "completed", "archived"],
                "description": "Project status. Defaults to planning.",
            },
            "kind": {"type": "string", "description": "Optional category/kind label."},
        },
        "required": ["title"],
        "additionalProperties": False,
    },
    returns="{ project: object }",
    executor=execute,
)
