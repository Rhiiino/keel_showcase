# stack_sandbox/backend/src/llm/tools/native/contacts/update_contact.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
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
from modules.contacts.schemas import ContactUpdate


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update an existing contact."""
    contact_id = arguments.get("contact_id")
    if not isinstance(contact_id, int) or contact_id < 1:
        raise AppError("contact_id must be a positive integer.", status_code=400)
    try:
        payload_kwargs: dict[str, Any] = {}
        for key in (
            "first_name",
            "last_name",
            "gender",
            "notes",
            "status",
        ):
            if key in arguments:
                payload_kwargs[key] = optional_str(arguments, key)
        if "birth_date" in arguments:
            payload_kwargs["birth_date"] = optional_date(arguments, "birth_date")
        if "death_date" in arguments:
            payload_kwargs["death_date"] = optional_date(arguments, "death_date")
        if "birth_date_year_known" in arguments:
            payload_kwargs["birth_date_year_known"] = optional_bool(
                arguments,
                "birth_date_year_known",
            )
        if "tag_ids" in arguments:
            payload_kwargs["tag_ids"] = optional_int_list(arguments, "tag_ids")
        payload = ContactUpdate(**payload_kwargs)
    except ValueError as exc:
        raise AppError(str(exc), status_code=400) from exc
    updated = await contacts_service.update_contact(
        context.user_id,
        contact_id,
        payload,
    )
    return {"contact": dump_model(updated)}


TOOL_DEFINITION = ToolDefinition(
    name="update_contact",
    category=PEOPLE,
    description="Update a contact's profile fields or tag assignments.",
    parameters={
        "type": "object",
        "properties": {
            "contact_id": {"type": "integer", "description": "Contact id."},
            **PERSON_FIELD_PROPERTIES,
            "tag_ids": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "Replace all tag assignments when provided.",
            },
        },
        "required": ["contact_id"],
        "additionalProperties": False,
    },
    returns="{ contact: object }",
    executor=execute,
)
