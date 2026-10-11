# stack_sandbox/backend/src/llm/tools/native/figures/update_figure.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
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
from modules.figures.schemas import FigureUpdate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update an existing figure."""
    figure_id = arguments.get("figure_id")
    if not isinstance(figure_id, int) or figure_id < 1:
        raise AppError("figure_id must be a positive integer.", status_code=400)
    try:
        payload_kwargs: dict[str, Any] = {}
        for key in (
            "first_name",
            "last_name",
            "gender",
            "notes",
            "status",
        ):
            if key in arguments:
                payload_kwargs[key] = optional_str(arguments, key)
        if "birth_date" in arguments:
            payload_kwargs["birth_date"] = optional_date(arguments, "birth_date")
        if "death_date" in arguments:
            payload_kwargs["death_date"] = optional_date(arguments, "death_date")
        if "birth_date_year_known" in arguments:
            payload_kwargs["birth_date_year_known"] = optional_bool(
                arguments,
                "birth_date_year_known",
            )
        payload = FigureUpdate(**payload_kwargs)
    except ValueError as exc:
        raise AppError(str(exc), status_code=400) from exc
    updated = await figures_service.update_figure(
        context.user_id,
        figure_id,
        payload,
    )
    return {"figure": dump_model(updated)}


TOOL_DEFINITION = ToolDefinition(
    name="update_figure",
    category=PEOPLE,
    description="Update a figure's profile fields.",
    parameters={
        "type": "object",
        "properties": {
            "figure_id": {"type": "integer", "description": "Figure id."},
            **PERSON_FIELD_PROPERTIES,
        },
        "required": ["figure_id"],
        "additionalProperties": False,
    },
    returns="{ figure: object }",
    executor=execute,
)
