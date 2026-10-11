# keel_api/src/llm/tools/native/coak/update_coak_record.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import dump_model, require_record_id
from modules.coak.schemas import CoakRecordUpdate
from modules.coak.service import records as records_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update a Coak record name or origin color."""
    record_id = require_record_id(arguments)
    payload = CoakRecordUpdate(
        **{
            key: arguments[key]
            for key in ("name", "color_hex")
            if key in arguments
        }
    )
    updated = await records_service.update_record(context.user_id, record_id, payload)
    return {"record": dump_model(updated)}


TOOL_DEFINITION = ToolDefinition(
    name="update_coak_record",
    category=COAK,
    description="Update a Coak record name or origin node color.",
    parameters={
        "type": "object",
        "properties": {
            "record_id": {"type": "integer"},
            "name": {"type": "string"},
            "color_hex": {
                "type": ["string", "null"],
                "description": "Origin node color hex like #FBBF24.",
            },
        },
        "required": ["record_id"],
        "additionalProperties": False,
    },
    returns="{ record: object }",
    executor=execute,
)
