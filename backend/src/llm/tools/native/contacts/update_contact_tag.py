# stack_sandbox/backend/src/llm/tools/native/contacts/update_contact_tag.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.contacts._contacts import dump_model, optional_str
from modules.contacts import service as contacts_service
from modules.contacts.schemas import ContactTagUpdate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update a contact tag."""
    tag_id = arguments.get("tag_id")
    if not isinstance(tag_id, int) or tag_id < 1:
        raise AppError("tag_id must be a positive integer.", status_code=400)
    payload_kwargs: dict[str, Any] = {}
    if "name" in arguments:
        payload_kwargs["name"] = optional_str(arguments, "name")
    if "color_hex" in arguments:
        payload_kwargs["color_hex"] = optional_str(arguments, "color_hex")
    payload = ContactTagUpdate(**payload_kwargs)
    updated = await contacts_service.update_contact_tag(
        context.user_id,
        tag_id,
        payload,
    )
    return {"tag": dump_model(updated)}


TOOL_DEFINITION = ToolDefinition(
    name="update_contact_tag",
    category=PEOPLE,
    description="Update a contact tag name or color.",
    parameters={
        "type": "object",
        "properties": {
            "tag_id": {"type": "integer"},
            "name": {"type": "string"},
            "color_hex": {"type": "string"},
        },
        "required": ["tag_id"],
        "additionalProperties": False,
    },
    returns="{ tag: object }",
    executor=execute,
)
