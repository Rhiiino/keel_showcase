# stack_sandbox/backend/src/llm/agents/registry.py
"""Agent definitions from the DB-backed catalog cache."""

from __future__ import annotations

from core.errors import AppError
from llm.agents.contracts import AgentDefinition
from llm.catalog.cache import get_catalog_cache


def get_agent(agent_id: str) -> AgentDefinition:
    """Return one agent definition or raise 404."""
    cache = get_catalog_cache()
    cache.require_loaded()
    agent = cache.agents.get(agent_id)
    if agent is None:
        raise AppError(f"Unknown agent {agent_id!r}", status_code=404)
    return agent


def list_agents() -> list[AgentDefinition]:
    """Return registered agents in catalog sort order."""
    cache = get_catalog_cache()
    cache.require_loaded()
    return [cache.agents[agent_id] for agent_id in cache.agent_order if agent_id in cache.agents]


def get_orchestrator() -> AgentDefinition:
    """Return the enabled orchestrator agent."""
    cache = get_catalog_cache()
    cache.require_loaded()
    for agent in list_agents():
        if agent.is_orchestrator:
            return agent
    raise AppError("No orchestrator agent is registered.", status_code=500)


def get_delegatable_agents(orchestrator_id: str = "keel") -> list[AgentDefinition]:
    """List agents the orchestrator may delegate to."""
    orchestrator = get_agent(orchestrator_id)
    cache = get_catalog_cache()
    return [
        cache.agents[agent_id]
        for agent_id in sorted(orchestrator.delegates_to)
        if agent_id in cache.agents
    ]
