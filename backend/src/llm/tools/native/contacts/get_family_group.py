# stack_sandbox/backend/src/llm/tools/native/contacts/get_family_group.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.contacts._contacts import dump_model
from modules.contacts import service as contacts_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Get one family group by key."""
    family_key = arguments.get("family_key")
    if not isinstance(family_key, str) or not family_key.strip():
        raise AppError("family_key is required.", status_code=400)
    group = await contacts_service.get_family_group(
        context.user_id,
        family_key.strip(),
    )
    return {"family_group": dump_model(group)}


TOOL_DEFINITION = ToolDefinition(
    name="get_family_group",
    category=PEOPLE,
    description="Get one computed family group by family_key.",
    parameters={
        "type": "object",
        "properties": {
            "family_key": {
                "type": "string",
                "description": "Stable family group identifier.",
            },
        },
        "required": ["family_key"],
        "additionalProperties": False,
    },
    returns="{ family_group: object }",
    executor=execute,
)
