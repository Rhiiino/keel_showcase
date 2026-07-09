# keel_api/src/llm/tools/native/projects/list_project_canvases.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import PROJECTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.projects._projects import dump_models, resolve_project_id
from modules.projects.service import canvases_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List workspace canvases for a project."""
    project_id = resolve_project_id(arguments, context)
    canvases = await canvases_service.list_project_canvases(context.user_id, project_id)
    return {"canvases": dump_models(canvases), "count": len(canvases)}


TOOL_DEFINITION = ToolDefinition(
    name="list_project_canvases",
    category=PROJECTS,
    description="List workspace canvases for a project (name, default flag, sort order).",
    parameters={
        "type": "object",
        "properties": {
            "project_id": {
                "type": "integer",
                "description": "Project id (defaults to the active workspace project).",
            },
        },
        "required": [],
        "additionalProperties": False,
    },
    returns="{ canvases: array, count: integer }",
    executor=execute,
)
