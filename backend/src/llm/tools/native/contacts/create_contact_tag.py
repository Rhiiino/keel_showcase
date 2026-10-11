# stack_sandbox/backend/src/llm/tools/native/contacts/create_contact_tag.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.contacts._contacts import dump_model, optional_str
from modules.contacts import service as contacts_service
from modules.contacts.schemas import ContactTagCreate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Create a contact tag."""
    name = arguments.get("name")
    if not isinstance(name, str) or not name.strip():
        raise AppError("name is required.", status_code=400)
    payload = ContactTagCreate(
        name=name.strip(),
        color_hex=optional_str(arguments, "color_hex"),
    )
    created = await contacts_service.create_contact_tag(context.user_id, payload)
    return {"tag": dump_model(created)}


TOOL_DEFINITION = ToolDefinition(
    name="create_contact_tag",
    category=PEOPLE,
    description="Create a tag for categorizing contacts.",
    parameters={
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "color_hex": {
                "type": "string",
                "description": "Hex color like #06B6D4.",
            },
        },
        "required": ["name"],
        "additionalProperties": False,
    },
    returns="{ tag: object }",
    executor=execute,
)
