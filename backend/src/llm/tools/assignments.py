# stack_sandbox/backend/src/llm/tools/assignments.py
"""Agent -> tool category grants from the DB-backed catalog cache."""

from __future__ import annotations

from typing import Any

from llm.catalog.cache import get_catalog_cache
from llm.tools.registry import TOOL_CATEGORY_MAP, TOOL_DEFINITIONS


def get_tool_categories_for_agent(agent_id: str) -> frozenset[str]:
    """Return tool category keys granted to an agent."""
    cache = get_catalog_cache()
    cache.require_loaded()
    return cache.agent_tool_categories.get(agent_id, frozenset())


def get_tools_for_agent(agent_id: str) -> list[dict[str, Any]]:
    """Build OpenAI tool schemas allowed for an agent."""
    allowed = get_tool_categories_for_agent(agent_id)
    if not allowed:
        return []
    return [
        definition.to_openai_schema()
        for definition in TOOL_DEFINITIONS.values()
        if definition.category in allowed
    ]


def is_tool_allowed_for_agent(agent_id: str, tool_name: str) -> bool:
    """Check whether a tool name is granted to an agent."""
    category = TOOL_CATEGORY_MAP.get(tool_name)
    if category is None:
        return False
    return category in get_tool_categories_for_agent(agent_id)
