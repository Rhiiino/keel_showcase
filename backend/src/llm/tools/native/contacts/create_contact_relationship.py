# stack_sandbox/backend/src/llm/tools/native/contacts/create_contact_relationship.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.contacts._contacts import dump_model
from modules.contacts import service as contacts_service
from modules.contacts.schemas import ContactRelationshipCreate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Create a contact relationship."""
    from_contact_id = arguments.get("from_contact_id")
    to_contact_id = arguments.get("to_contact_id")
    relationship_type = arguments.get("relationship_type")
    if not isinstance(from_contact_id, int) or from_contact_id < 1:
        raise AppError("from_contact_id must be a positive integer.", status_code=400)
    if not isinstance(to_contact_id, int) or to_contact_id < 1:
        raise AppError("to_contact_id must be a positive integer.", status_code=400)
    if not isinstance(relationship_type, str) or not relationship_type.strip():
        raise AppError("relationship_type is required.", status_code=400)
    payload = ContactRelationshipCreate(
        from_contact_id=from_contact_id,
        to_contact_id=to_contact_id,
        relationship_type=relationship_type.strip(),
    )
    created = await contacts_service.create_relationship(context.user_id, payload)
    return {"relationship": dump_model(created)}


TOOL_DEFINITION = ToolDefinition(
    name="create_contact_relationship",
    category=PEOPLE,
    description="Create a directed relationship between two contacts.",
    parameters={
        "type": "object",
        "properties": {
            "from_contact_id": {"type": "integer"},
            "to_contact_id": {"type": "integer"},
            "relationship_type": {
                "type": "string",
                "enum": ["spouse", "parent", "sibling", "friend"],
            },
        },
        "required": ["from_contact_id", "to_contact_id", "relationship_type"],
        "additionalProperties": False,
    },
    returns="{ relationship: object }",
    executor=execute,
)
