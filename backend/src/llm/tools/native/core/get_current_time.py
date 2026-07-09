# stack_sandbox/backend/src/llm/tools/native/core/get_current_time.py
"""Example `core` tool: return the current UTC time.

Serves as the reference shape for a tool module — a `TOOL_DEFINITION` plus an
async `execute()` — and proves the orchestrator's tool-execution loop end to end.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from llm.tools.categories import CORE
from llm.tools.contracts import ToolContext, ToolDefinition


async def execute(arguments: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    """Return the current UTC date and time for the agent."""
    now = datetime.now(timezone.utc)
    return {"utc_iso": now.isoformat(), "epoch_seconds": int(now.timestamp())}


TOOL_DEFINITION = ToolDefinition(
    name="get_current_time",
    category=CORE,
    description="Get the current date and time in UTC. Use when the user asks for the current time/date or you need a timestamp.",
    parameters={
        "type": "object",
        "properties": {},
        "additionalProperties": False,
    },
    returns='{ utc_iso: string (ISO 8601 UTC), epoch_seconds: integer }',
    executor=execute,
)
