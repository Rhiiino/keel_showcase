# stack_sandbox/backend/src/llm/tools/native/contacts/list_contacts.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import CONTACTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.contacts._contacts import dump_models
from modules.contacts import service as contacts_service


async def execute(_arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """List all contacts."""
    contacts = await contacts_service.list_contacts(context.user_id)
    return {"contacts": dump_models(contacts), "count": len(contacts)}


TOOL_DEFINITION = ToolDefinition(
    name="list_contacts",
    category=CONTACTS,
    description="List all contacts with names, gender, birth dates, and computed nuclear families.",
    parameters={"type": "object", "properties": {}, "additionalProperties": False},
    returns="{ contacts: array, count: integer }",
    executor=execute,
)
