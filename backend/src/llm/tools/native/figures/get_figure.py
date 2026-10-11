# stack_sandbox/backend/src/llm/tools/native/figures/get_figure.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.figures._figures import dump_model
from modules.figures import service as figures_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Fetch one figure by id."""
    figure_id = arguments.get("figure_id")
    if not isinstance(figure_id, int) or figure_id < 1:
        raise AppError("figure_id must be a positive integer.", status_code=400)
    figure = await figures_service.get_figure(context.user_id, figure_id)
    return {"figure": dump_model(figure)}


TOOL_DEFINITION = ToolDefinition(
    name="get_figure",
    category=PEOPLE,
    description="Get one figure by id.",
    parameters={
        "type": "object",
        "properties": {
            "figure_id": {"type": "integer", "description": "Figure id."},
        },
        "required": ["figure_id"],
        "additionalProperties": False,
    },
    returns="{ figure: object }",
    executor=execute,
)
