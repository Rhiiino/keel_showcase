# stack_sandbox/backend/src/llm/tools/native/contacts/search_contacts.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import CONTACTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.contacts._contacts import dump_models
from modules.contacts import service as contacts_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Search contacts by name."""
    query = arguments.get("query")
    if not isinstance(query, str):
        raise ValueError("query must be a string")
    contacts = await contacts_service.search_contacts(context.user_id, query)
    return {"contacts": dump_models(contacts), "count": len(contacts)}


TOOL_DEFINITION = ToolDefinition(
    name="search_contacts",
    category=CONTACTS,
    description="Search contacts by first or last name.",
    parameters={
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Name search text."},
        },
        "required": ["query"],
        "additionalProperties": False,
    },
    returns="{ contacts: array, count: integer }",
    executor=execute,
)
