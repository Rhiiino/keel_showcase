# stack_sandbox/backend/src/llm/tools/manifest.py

"""Build the tool manifest an agent sends to the LLM (including virtual delegate)."""

from __future__ import annotations

from typing import Any

from llm.agents.registry import get_agent
from llm.orchestrator.delegation import build_delegate_tool
from llm.tools.assignments import get_tools_for_agent


def build_tool_manifest_for_agent(agent_id: str) -> list[dict[str, Any]]:
    """Return OpenAI-format tool schemas for an agent, plus delegate when applicable."""
    agent = get_agent(agent_id)
    tools = list(get_tools_for_agent(agent_id))
    delegate_tool = build_delegate_tool(agent)
    if delegate_tool is not None:
        tools.append(delegate_tool)
    return tools
