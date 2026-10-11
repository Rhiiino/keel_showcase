# keel_api/src/llm/tools/native/coak/get_coak_workspace_state.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import dump_model, require_record_id
from modules.coak.service import workspace_state as workspace_state_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Get constellation workspace layout for a Coak record."""
    record_id = require_record_id(arguments)
    state = await workspace_state_service.get_workspace_state(context.user_id, record_id)
    return {"workspace_state": dump_model(state)}


TOOL_DEFINITION = ToolDefinition(
    name="get_coak_workspace_state",
    category=COAK,
    description=(
        "Get the constellation workspace layout for a Coak record, including "
        "node positions, expanded folders, pinned items, and camera."
    ),
    parameters={
        "type": "object",
        "properties": {
            "record_id": {"type": "integer"},
        },
        "required": ["record_id"],
        "additionalProperties": False,
    },
    returns="{ workspace_state: object }",
    executor=execute,
)
