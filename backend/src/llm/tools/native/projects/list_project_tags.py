# stack_sandbox/backend/src/llm/tools/native/projects/list_project_tags.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import PROJECTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.projects._projects import dump_models
from modules.projects import service as projects_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List all project tags for the user."""
    del arguments
    tags = await projects_service.list_project_tags(context.user_id)
    return {"tags": dump_models(tags), "count": len(tags)}


TOOL_DEFINITION = ToolDefinition(
    name="list_project_tags",
    category=PROJECTS,
    description="List all project tags for the user.",
    parameters={"type": "object", "properties": {}, "additionalProperties": False},
    returns="{ tags: array, count: integer }",
    executor=execute,
)
