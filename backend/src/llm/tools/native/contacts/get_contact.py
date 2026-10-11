# stack_sandbox/backend/src/llm/tools/native/contacts/get_contact.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import CONTACTS
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.contacts._contacts import dump_model
from modules.contacts import service as contacts_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Fetch one contact by id."""
    contact_id = arguments.get("contact_id")
    if not isinstance(contact_id, int):
        raise ValueError("contact_id must be an integer")
    contact = await contacts_service.get_contact(context.user_id, contact_id)
    relationships = await contacts_service.list_contact_relationships(
        context.user_id,
        contact_id,
    )
    return {
        "contact": dump_model(contact),
        "relationships": [rel.model_dump(mode="json") for rel in relationships],
    }


TOOL_DEFINITION = ToolDefinition(
    name="get_contact",
    category=CONTACTS,
    description="Get one contact by id, including relationships.",
    parameters={
        "type": "object",
        "properties": {
            "contact_id": {"type": "integer", "description": "Contact id."},
        },
        "required": ["contact_id"],
        "additionalProperties": False,
    },
    returns="{ contact: object, relationships: array }",
    executor=execute,
)
