# keel_api/src/llm/tools/native/coak/create_coak_record.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import dump_model
from modules.coak.schemas import CoakRecordCreate
from modules.coak.service import records as records_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Create a new Coak record."""
    name = arguments.get("name")
    if not isinstance(name, str) or not name.strip():
        raise AppError("name is required.", status_code=400)
    payload = CoakRecordCreate(
        name=name.strip(),
        color_hex=arguments.get("color_hex"),
    )
    created = await records_service.create_record(context.user_id, payload)
    return {"record": dump_model(created)}


TOOL_DEFINITION = ToolDefinition(
    name="create_coak_record",
    category=COAK,
    description="Create a new Coak learning workspace record.",
    parameters={
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "Record name.",
            },
            "color_hex": {
                "type": ["string", "null"],
                "description": "Optional origin node color hex like #FBBF24.",
            },
        },
        "required": ["name"],
        "additionalProperties": False,
    },
    returns="{ record: object }",
    executor=execute,
)
