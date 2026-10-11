# stack_sandbox/backend/src/llm/tools/native/contacts/update_contact_relationship.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.contacts._contacts import dump_model
from modules.contacts import service as contacts_service
from modules.contacts.schemas import ContactRelationshipUpdate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update a contact relationship."""
    relationship_id = arguments.get("relationship_id")
    from_contact_id = arguments.get("from_contact_id")
    to_contact_id = arguments.get("to_contact_id")
    relationship_type = arguments.get("relationship_type")
    if not isinstance(relationship_id, int) or relationship_id < 1:
        raise AppError("relationship_id must be a positive integer.", status_code=400)
    if not isinstance(from_contact_id, int) or from_contact_id < 1:
        raise AppError("from_contact_id must be a positive integer.", status_code=400)
    if not isinstance(to_contact_id, int) or to_contact_id < 1:
        raise AppError("to_contact_id must be a positive integer.", status_code=400)
    if not isinstance(relationship_type, str) or not relationship_type.strip():
        raise AppError("relationship_type is required.", status_code=400)
    payload = ContactRelationshipUpdate(
        from_contact_id=from_contact_id,
        to_contact_id=to_contact_id,
        relationship_type=relationship_type.strip(),
    )
    updated = await contacts_service.update_relationship(
        context.user_id,
        relationship_id,
        payload,
    )
    return {"relationship": dump_model(updated)}


TOOL_DEFINITION = ToolDefinition(
    name="update_contact_relationship",
    category=PEOPLE,
    description="Update a contact relationship's endpoints or type.",
    parameters={
        "type": "object",
        "properties": {
            "relationship_id": {"type": "integer"},
            "from_contact_id": {"type": "integer"},
            "to_contact_id": {"type": "integer"},
            "relationship_type": {
                "type": "string",
                "enum": ["spouse", "parent", "sibling", "friend"],
            },
        },
        "required": [
            "relationship_id",
            "from_contact_id",
            "to_contact_id",
            "relationship_type",
        ],
        "additionalProperties": False,
    },
    returns="{ relationship: object }",
    executor=execute,
)
