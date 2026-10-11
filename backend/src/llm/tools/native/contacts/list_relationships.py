# stack_sandbox/backend/src/llm/tools/native/contacts/list_relationships.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.contacts._contacts import dump_models
from modules.contacts import service as contacts_service


async def execute(_arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List all contact relationships."""
    relationships = await contacts_service.list_relationships(context.user_id)
    return {
        "relationships": dump_models(relationships),
        "count": len(relationships),
    }


TOOL_DEFINITION = ToolDefinition(
    name="list_relationships",
    category=PEOPLE,
    description="List all contact relationships for the user.",
    parameters={"type": "object", "properties": {}, "additionalProperties": False},
    returns="{ relationships: array, count: integer }",
    executor=execute,
)
