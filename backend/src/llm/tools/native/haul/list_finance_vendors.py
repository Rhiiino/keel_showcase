# stack_sandbox/backend/src/llm/tools/native/haul/list_shop_merchants.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import HAUL
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.haul._haul import dump_models
from modules.finance import service as finance_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List the user's shop merchants."""
    query = arguments.get("query")
    merchants = await finance_service.list_vendors(
        context.user_id,
        query=query if isinstance(query, str) else None,
    )
    return {"vendors": dump_models(merchants)}


TOOL_DEFINITION = ToolDefinition(
    name="list_finance_vendors",
    category=HAUL,
    description="List the user's shop merchants.",
    parameters={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Optional filter by merchant name (case-insensitive).",
            },
        },
        "additionalProperties": False,
    },
    returns="{ merchants: object[] }",
    executor=execute,
)
