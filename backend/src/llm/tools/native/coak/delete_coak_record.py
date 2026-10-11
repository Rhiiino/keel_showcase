# keel_api/src/llm/tools/native/coak/delete_coak_record.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import require_record_id
from modules.coak.service import records as records_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Delete a Coak record."""
    record_id = require_record_id(arguments)
    await records_service.delete_record(context.user_id, record_id)
    return {"deleted": True, "record_id": record_id}


TOOL_DEFINITION = ToolDefinition(
    name="delete_coak_record",
    category=COAK,
    description="Delete a Coak record and move it to trash.",
    parameters={
        "type": "object",
        "properties": {
            "record_id": {"type": "integer"},
        },
        "required": ["record_id"],
        "additionalProperties": False,
    },
    returns="{ deleted: boolean, record_id: integer }",
    executor=execute,
)
