# stack_sandbox/backend/src/llm/tools/native/projects/get_project_canvas.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import PROJECTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.projects._projects import (
    dump_model,
    resolve_canvas_id,
    resolve_project_id,
)
from modules.projects import service as projects_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Read the saved workspace canvas state (nodes, edges, viewport) for a project."""
    project_id = resolve_project_id(arguments, context)
    canvas_id = await resolve_canvas_id(
        arguments,
        context,
        user_id=context.user_id,
        project_id=project_id,
    )
    workspace = await projects_service.get_workspace(
        context.user_id,
        project_id,
        canvas_id,
    )
    return {"canvas": dump_model(workspace)}


TOOL_DEFINITION = ToolDefinition(
    name="get_project_canvas",
    category=PROJECTS,
    description="Read the saved workspace canvas state (nodes, edges, viewport) for a project.",
    parameters={
        "type": "object",
        "properties": {
            "project_id": {
                "type": "integer",
                "description": "Project id (defaults to the active workspace project).",
            },
            "canvas_id": {
                "type": "integer",
                "description": "Canvas id (defaults to the project's default canvas).",
            },
        },
        "required": [],
        "additionalProperties": False,
    },
    returns="{ canvas: { project_id, canvas_id, state, updated_at } }",
    executor=execute,
)
