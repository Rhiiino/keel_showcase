# keel_api/src/llm/tools/native/projects/set_project_cover.py

from __future__ import annotations

from typing import Any
from uuid import UUID

from core.errors import AppError
from llm.tools.categories import PROJECTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.projects._projects import dump_model
from modules.media import service as media_service
from modules.media.schemas import MediaAttachmentCreate
from modules.projects import service as projects_service


def _parse_media_id(raw: object) -> UUID:
    """Parse a media UUID from tool arguments."""
    if isinstance(raw, UUID):
        return raw
    if isinstance(raw, str):
        try:
            return UUID(raw.strip())
        except ValueError as exc:
            raise AppError("media_id must be a valid UUID.", status_code=400) from exc
    raise AppError("media_id must be a UUID string.", status_code=400)


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Set a project's cover image from an existing uploaded media file."""
    project_id = arguments.get("project_id")
    if not isinstance(project_id, int) or project_id < 1:
        raise AppError("project_id must be a positive integer.", status_code=400)

    media_id = _parse_media_id(arguments.get("media_id"))
    await media_service.create_attachment(
        context.user_id,
        media_id,
        MediaAttachmentCreate(
            entity_type="project",
            entity_id=project_id,
            role="cover",
        ),
    )
    project = await projects_service.get_project(context.user_id, project_id)
    return {"project": dump_model(project)}


TOOL_DEFINITION = ToolDefinition(
    name="set_project_cover",
    category=PROJECTS,
    description=(
        "Set a project's cover image from an existing uploaded media file "
        "(image or 3D model)."
    ),
    parameters={
        "type": "object",
        "properties": {
            "project_id": {"type": "integer", "description": "Project id."},
            "media_id": {
                "type": "string",
                "description": "UUID of an existing media object to use as cover.",
            },
        },
        "required": ["project_id", "media_id"],
        "additionalProperties": False,
    },
    returns="{ project: object }",
    executor=execute,
)
