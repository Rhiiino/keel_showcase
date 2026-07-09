# stack_sandbox/backend/src/llm/tools/native/projects/list_projects.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import PROJECTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.projects._projects import dump_models
from modules.projects import service as projects_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List all personal projects for the user with status, tags, and appearance summary."""
    del arguments
    projects = await projects_service.list_projects(context.user_id)
    return {"projects": dump_models(projects), "count": len(projects)}


TOOL_DEFINITION = ToolDefinition(
    name="list_projects",
    category=PROJECTS,
    description="List all personal projects for the user with status, tags, and appearance summary.",
    parameters={"type": "object", "properties": {}, "additionalProperties": False},
    returns="{ projects: array of project objects, count: integer }",
    executor=execute,
)
