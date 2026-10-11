# stack_sandbox/backend/src/llm/tools/native/figures/create_figure.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.figures._figures import (
    PERSON_FIELD_PROPERTIES,
    dump_model,
    optional_bool,
    optional_date,
    optional_str,
)
from modules.figures import service as figures_service
from modules.figures.schemas import FigureCreate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Create a new figure."""
    try:
        payload = FigureCreate(
            first_name=optional_str(arguments, "first_name"),
            last_name=optional_str(arguments, "last_name"),
            gender=optional_str(arguments, "gender"),
            birth_date=optional_date(arguments, "birth_date"),
            birth_date_year_known=optional_bool(arguments, "birth_date_year_known")
            if "birth_date_year_known" in arguments
            else True,
            death_date=optional_date(arguments, "death_date"),
            notes=str(arguments.get("notes") or ""),
            status=str(arguments.get("status") or "active"),
        )
    except ValueError as exc:
        raise ValueError(str(exc)) from exc
    created = await figures_service.create_figure(context.user_id, payload)
    return {"figure": dump_model(created)}


TOOL_DEFINITION = ToolDefinition(
    name="create_figure",
    category=PEOPLE,
    description="Create a new notable/public figure record.",
    parameters={
        "type": "object",
        "properties": PERSON_FIELD_PROPERTIES,
        "additionalProperties": False,
    },
    returns="{ figure: object }",
    executor=execute,
)
