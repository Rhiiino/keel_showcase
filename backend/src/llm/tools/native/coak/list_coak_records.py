# keel_api/src/llm/tools/native/coak/list_coak_records.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import dump_models
from modules.coak.service import records as records_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List the user's Coak records."""
    records = await records_service.list_records(context.user_id)
    return {"records": dump_models(records), "count": len(records)}


TOOL_DEFINITION = ToolDefinition(
    name="list_coak_records",
    category=COAK,
    description="List the user's Coak learning workspace records.",
    parameters={
        "type": "object",
        "properties": {},
        "additionalProperties": False,
    },
    returns="{ records: array, count: integer }",
    executor=execute,
)
