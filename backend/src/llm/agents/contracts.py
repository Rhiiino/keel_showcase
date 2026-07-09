# stack_sandbox/backend/src/llm/agents/contracts.py
"""Agent definition type.

Kept separate from `registry.py` so individual agent modules and the registry can
both import it without a circular dependency.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class AgentDefinition:
    """Runtime agent shape hydrated from the DB-backed catalog cache."""

    id: str
    display_name: str
    description: str  # short routing-facing summary; used to build Keel's sub-agent catalog
    system_prompt_key: str  # key into llm/prompts/registry.py
    tool_categories: frozenset[str]  # categories from llm/tools/categories.py
    is_orchestrator: bool = False  # True only for Keel
    delegates_to: frozenset[str] = field(default_factory=frozenset)  # sub-agent ids
