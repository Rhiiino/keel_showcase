# stack_sandbox/backend/src/llm/tools/native/figures/delete_figure.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from modules.figures import service as figures_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Delete a figure (moves to trash)."""
    figure_id = arguments.get("figure_id")
    if not isinstance(figure_id, int) or figure_id < 1:
        raise AppError("figure_id must be a positive integer.", status_code=400)
    await figures_service.delete_figure(context.user_id, figure_id)
    return {"deleted": True, "figure_id": figure_id}


TOOL_DEFINITION = ToolDefinition(
    name="delete_figure",
    category=PEOPLE,
    description="Delete a figure and move it to trash.",
    parameters={
        "type": "object",
        "properties": {
            "figure_id": {"type": "integer", "description": "Figure id."},
        },
        "required": ["figure_id"],
        "additionalProperties": False,
    },
    returns="{ deleted: boolean, figure_id: integer }",
    executor=execute,
)
