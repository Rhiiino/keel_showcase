# stack_sandbox/backend/src/llm/tools/native/contacts/delete_contact_relationship.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from modules.contacts import service as contacts_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Delete a contact relationship."""
    relationship_id = arguments.get("relationship_id")
    if not isinstance(relationship_id, int) or relationship_id < 1:
        raise AppError("relationship_id must be a positive integer.", status_code=400)
    await contacts_service.delete_relationship(context.user_id, relationship_id)
    return {"deleted": True, "relationship_id": relationship_id}


TOOL_DEFINITION = ToolDefinition(
    name="delete_contact_relationship",
    category=PEOPLE,
    description="Delete a contact relationship.",
    parameters={
        "type": "object",
        "properties": {
            "relationship_id": {"type": "integer"},
        },
        "required": ["relationship_id"],
        "additionalProperties": False,
    },
    returns="{ deleted: boolean, relationship_id: integer }",
    executor=execute,
)
