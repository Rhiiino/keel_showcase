# stack_sandbox/backend/src/llm/tools/native/contacts/delete_contact.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from modules.contacts import service as contacts_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Delete a contact (moves to trash)."""
    contact_id = arguments.get("contact_id")
    if not isinstance(contact_id, int) or contact_id < 1:
        raise AppError("contact_id must be a positive integer.", status_code=400)
    await contacts_service.delete_contact(context.user_id, contact_id)
    return {"deleted": True, "contact_id": contact_id}


TOOL_DEFINITION = ToolDefinition(
    name="delete_contact",
    category=PEOPLE,
    description="Delete a contact and move it to trash. Cannot delete the self contact.",
    parameters={
        "type": "object",
        "properties": {
            "contact_id": {"type": "integer", "description": "Contact id."},
        },
        "required": ["contact_id"],
        "additionalProperties": False,
    },
    returns="{ deleted: boolean, contact_id: integer }",
    executor=execute,
)
