# stack_sandbox/backend/src/llm/tools/native/contacts/get_family_group_tree.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import PEOPLE
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.contacts._contacts import dump_model
from modules.contacts import service as contacts_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Get a family tree subgraph for one family group."""
    family_key = arguments.get("family_key")
    if not isinstance(family_key, str) or not family_key.strip():
        raise AppError("family_key is required.", status_code=400)
    tree = await contacts_service.get_family_group_tree(
        context.user_id,
        family_key.strip(),
    )
    return {"family_tree": dump_model(tree)}


TOOL_DEFINITION = ToolDefinition(
    name="get_family_group_tree",
    category=PEOPLE,
    description="Get the family tree subgraph for one family group.",
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
    returns="{ family_tree: object }",
    executor=execute,
)
