# stack_sandbox/backend/src/llm/tools/native/contacts/list_contact_tags.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.contacts._contacts import dump_models
from modules.contacts import service as contacts_service


async def execute(_arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List all contact tags."""
    tags = await contacts_service.list_contact_tags(context.user_id)
    return {"tags": dump_models(tags), "count": len(tags)}


TOOL_DEFINITION = ToolDefinition(
    name="list_contact_tags",
    category=PEOPLE,
    description="List the user's contact tags.",
    parameters={"type": "object", "properties": {}, "additionalProperties": False},
    returns="{ tags: array, count: integer }",
    executor=execute,
)
