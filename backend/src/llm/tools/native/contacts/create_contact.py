# stack_sandbox/backend/src/llm/tools/native/contacts/create_contact.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.contacts._contacts import (
    PERSON_FIELD_PROPERTIES,
    dump_model,
    optional_bool,
    optional_date,
    optional_int_list,
    optional_str,
)
from modules.contacts import service as contacts_service
from modules.contacts.schemas import ContactCreate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Create a new contact."""
    try:
        tag_ids = optional_int_list(arguments, "tag_ids")
        payload = ContactCreate(
            first_name=optional_str(arguments, "first_name"),
            last_name=optional_str(arguments, "last_name"),
            gender=optional_str(arguments, "gender"),
            birth_date=optional_date(arguments, "birth_date"),
            birth_date_year_known=optional_bool(arguments, "birth_date_year_known")
            if "birth_date_year_known" in arguments
            else True,
            death_date=optional_date(arguments, "death_date"),
            notes=str(arguments.get("notes") or ""),
            status=str(arguments.get("status") or "active"),
            tag_ids=tag_ids or [],
        )
    except ValueError as exc:
        raise ValueError(str(exc)) from exc
    created = await contacts_service.create_contact(context.user_id, payload)
    return {"contact": dump_model(created)}


TOOL_DEFINITION = ToolDefinition(
    name="create_contact",
    category=PEOPLE,
    description="Create a new contact in the personal CRM.",
    parameters={
        "type": "object",
        "properties": {
            **PERSON_FIELD_PROPERTIES,
            "tag_ids": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "Optional tag ids to assign.",
            },
        },
        "additionalProperties": False,
    },
    returns="{ contact: object }",
    executor=execute,
)
