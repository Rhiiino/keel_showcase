# stack_sandbox/backend/src/llm/tools/native/contacts/list_family_groups.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.contacts._contacts import dump_models
from modules.contacts import service as contacts_service


async def execute(_arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List computed nuclear family groups."""
    groups = await contacts_service.list_family_groups(context.user_id)
    return {"family_groups": dump_models(groups), "count": len(groups)}


TOOL_DEFINITION = ToolDefinition(
    name="list_family_groups",
    category=PEOPLE,
    description="List computed nuclear family groups derived from contact relationships.",
    parameters={"type": "object", "properties": {}, "additionalProperties": False},
    returns="{ family_groups: array, count: integer }",
    executor=execute,
)
