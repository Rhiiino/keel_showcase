# stack_sandbox/backend/src/llm/tools/native/projects/set_project_appearance.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PROJECTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.projects._projects import dump_model
from modules.projects import service as projects_service
from modules.projects.schemas import ProjectUpdate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update project display appearance: 3D cover glow color, 3D model color, 3D model brightness (0.5–2.0), Kanban card border color, and title font."""
    project_id = arguments.get("project_id")
    if not isinstance(project_id, int) or project_id < 1:
        raise AppError("project_id must be a positive integer.", status_code=400)

    fields: dict[str, Any] = {}
    for key in (
        "cover_glow_color_hex",
        "cover_model_color_hex",
        "cover_model_brightness",
        "kanban_card_color_hex",
        "title_font_key",
    ):
        if key in arguments:
            fields[key] = arguments[key]

    if not fields:
        raise AppError("Provide at least one appearance field to update.", status_code=400)

    payload = ProjectUpdate(**fields)
    project = await projects_service.update_project(context.user_id, project_id, payload)
    return {"project": dump_model(project)}


TOOL_DEFINITION = ToolDefinition(
    name="set_project_appearance",
    category=PROJECTS,
    description=(
        "Update project display appearance: 3D cover glow color, 3D model color, "
        "3D model brightness (0.5–2.0), Kanban card border color, and title font."
    ),
    parameters={
        "type": "object",
        "properties": {
            "project_id": {"type": "integer", "description": "Project id."},
            "cover_glow_color_hex": {
                "type": "string",
                "description": "Hex color for 3D cover glow, e.g. #84CC16.",
            },
            "cover_model_color_hex": {
                "type": "string",
                "description": "Hex color for 3D model, e.g. #A8B5A0.",
            },
            "cover_model_brightness": {
                "type": "number",
                "description": "3D model brightness multiplier (0.5–2.0, default 1.0).",
            },
            "kanban_card_color_hex": {
                "type": "string",
                "description": "Hex color for Kanban card border, e.g. #1C1917.",
            },
            "title_font_key": {
                "type": "string",
                "description": "Title font key (default, serif, mono, etc.).",
            },
        },
        "required": ["project_id"],
        "additionalProperties": False,
    },
    returns="{ project: object }",
    executor=execute,
)
