# stack_sandbox/backend/src/llm/tools/native/projects/update_project_canvas.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PROJECTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.projects._projects import (
    dump_model,
    resolve_canvas_id,
    resolve_project_id,
)
from modules.projects import service as projects_service
from modules.projects.schemas import ProjectWorkspaceUpdate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Replace the full workspace canvas state for a project. Call get_project_canvas first, modify canvas.state (nodes/edges/viewport), then pass that state object here — not the outer canvas wrapper."""
    project_id = resolve_project_id(arguments, context)
    canvas_id = await resolve_canvas_id(
        arguments,
        context,
        user_id=context.user_id,
        project_id=project_id,
    )
    state = arguments.get("state")
    if not isinstance(state, dict):
        raise AppError("state must be a JSON object.", status_code=400)

    payload = ProjectWorkspaceUpdate(state=state)
    workspace = await projects_service.replace_workspace(
        context.user_id,
        project_id,
        canvas_id,
        payload.state,
    )
    return {"canvas": dump_model(workspace)}


TOOL_DEFINITION = ToolDefinition(
    name="update_project_canvas",
    category=PROJECTS,
    description=(
        "Replace the full workspace canvas state for a project. "
        "Call get_project_canvas first, modify canvas.state (nodes/edges/viewport), "
        "then pass that state object here — not the outer canvas wrapper."
    ),
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
            "state": {
                "type": "object",
                "description": (
                    "Full canvas state from get_project_canvas.canvas.state "
                    "(version, viewport, nodes, edges). For edge color changes, set "
                    "edges[].data.color (e.g. #2563eb for blue) and preserve edge type "
                    "workspace plus source/target ids."
                ),
            },
        },
        "required": ["state"],
        "additionalProperties": False,
    },
    returns="{ canvas: { project_id, canvas_id, state, updated_at } }",
    executor=execute,
)
