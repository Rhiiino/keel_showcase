# keel_api/src/llm/tools/native/coak/get_coak_record.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import dump_model, require_record_id
from modules.coak.service import records as records_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Fetch one Coak record by id."""
    record_id = require_record_id(arguments)
    record = await records_service.get_record(context.user_id, record_id)
    return {"record": dump_model(record)}


TOOL_DEFINITION = ToolDefinition(
    name="get_coak_record",
    category=COAK,
    description="Fetch one Coak record by id.",
    parameters={
        "type": "object",
        "properties": {
            "record_id": {
                "type": "integer",
                "description": "Coak record id.",
            },
        },
        "required": ["record_id"],
        "additionalProperties": False,
    },
    returns="{ record: object }",
    executor=execute,
)
