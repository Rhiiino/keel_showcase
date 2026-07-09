# keel_api/src/llm/tools/native/projects/list_project_media.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PROJECTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.projects._projects import dump_models
from modules.media import service as media_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List uploaded media files for a project (for choosing a cover or reference)."""
    project_id = arguments.get("project_id")
    if not isinstance(project_id, int) or project_id < 1:
        raise AppError("project_id must be a positive integer.", status_code=400)
    attachments = await media_service.list_for_entity(
        context.user_id,
        "project",
        project_id,
    )
    return {"media": dump_models(attachments), "count": len(attachments)}


TOOL_DEFINITION = ToolDefinition(
    name="list_project_media",
    category=PROJECTS,
    description="List uploaded media files for a project (for choosing a cover or reference).",
    parameters={
        "type": "object",
        "properties": {
            "project_id": {"type": "integer", "description": "Project id."},
        },
        "required": ["project_id"],
        "additionalProperties": False,
    },
    returns="{ media: array, count: integer }",
    executor=execute,
)
