# stack_sandbox/backend/src/llm/tools/native/figures/list_figures.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.figures._figures import dump_models
from modules.figures import service as figures_service


async def execute(_arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List all figures."""
    figures = await figures_service.list_figures(context.user_id)
    return {"figures": dump_models(figures), "count": len(figures)}


TOOL_DEFINITION = ToolDefinition(
    name="list_figures",
    category=PEOPLE,
    description="List all notable/public figures.",
    parameters={"type": "object", "properties": {}, "additionalProperties": False},
    returns="{ figures: array, count: integer }",
    executor=execute,
)
