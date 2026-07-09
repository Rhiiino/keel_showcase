# stack_sandbox/backend/src/llm/orchestrator/delegation.py
"""The `delegate` tool: how Keel hands a turn to a sub-agent.

This is an orchestrator-level / virtual tool. It is NOT in TOOL_REGISTRY,
TOOL_EXECUTORS, or any category — the orchestrator injects its schema into an
orchestrator agent's manifest and interprets the call itself (by switching the
active agent) rather than executing it like a data tool.
"""

from __future__ import annotations

from typing import Any

from llm.agents.contracts import AgentDefinition
from llm.agents.registry import get_delegatable_agents

DELEGATE_TOOL_NAME = "delegate"


def build_delegate_tool(agent: AgentDefinition) -> dict[str, Any] | None:
    """Return the `delegate` function-tool schema for an agent with sub-agents.

    The `agent_id` argument is an enum of the agent's delegatable sub-agents, with
    each option's purpose described inline. Returns None when the agent has no
    sub-agents to delegate to.
    """
    if not agent.delegates_to:
        return None

    targets = get_delegatable_agents(agent.id)
    if not targets:
        return None

    enum_ids = [target.id for target in targets]
    catalog = "; ".join(f"{target.id}: {target.description}" for target in targets)

    return {
        "type": "function",
        "function": {
            "name": DELEGATE_TOOL_NAME,
            "description": (
                "Hand the current turn to a specialist sub-agent when the request "
                "belongs to its domain. The sub-agent produces the full response. "
                f"Available sub-agents — {catalog}"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "agent_id": {
                        "type": "string",
                        "enum": enum_ids,
                        "description": "The sub-agent to hand this turn to.",
                    },
                    "task": {
                        "type": "string",
                        "description": "Optional short note describing what the sub-agent should do.",
                    },
                },
                "required": ["agent_id"],
                "additionalProperties": False,
            },
        },
    }


def parse_delegate_call(tool_calls: list[dict[str, Any]]) -> str | None:
    """Return the target agent_id if a `delegate` call is present, else None."""
    import json

    for tool_call in tool_calls:
        function = tool_call.get("function") or {}
        if function.get("name") != DELEGATE_TOOL_NAME:
            continue
        arguments_raw = function.get("arguments") or "{}"
        try:
            arguments = json.loads(arguments_raw)
        except json.JSONDecodeError:
            return None
        target = arguments.get("agent_id")
        return target if isinstance(target, str) and target else None
    return None
