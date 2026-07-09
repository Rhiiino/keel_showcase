# stack_sandbox/backend/src/llm/agents/llm_prefs.py
"""Resolve per-agent LLM provider/model (global chat prefs + optional sub-agent overrides)."""

from __future__ import annotations

from dataclasses import dataclass

from core.database import get_pool
from core.errors import AppError
from llm.agents.registry import get_agent, list_agents
from llm.models.registry import get_model
from llm.models.registry import is_known_provider
from llm.providers.factory import resolve_model_id
from modules.agents import repository as agents_repository


@dataclass(frozen=True)
class ResolvedLlm:
    provider: str
    model_id: str
    max_context_window: int
    has_override: bool


def _resolved_from_provider_model(
    provider: str,
    model_id: str,
    *,
    has_override: bool,
) -> ResolvedLlm:
    """Build ResolvedLlm with registry context window metadata."""
    entry = get_model(model_id)
    if entry is None:
        raise AppError("Configured model is not in the registry.", status_code=500)
    window = entry["max_context_window"] or 0
    return ResolvedLlm(
        provider=provider,
        model_id=model_id,
        max_context_window=window,
        has_override=has_override,
    )


def validate_provider_model(provider: str, model_id: str) -> tuple[str, str]:
    """Normalize and validate provider + model against the registry."""
    normalized_provider = provider.strip().lower()
    if not is_known_provider(normalized_provider):
        raise AppError(f"Unknown provider: {normalized_provider!r}", status_code=400)
    resolved_model = resolve_model_id(provider_name=normalized_provider, model=model_id)
    if get_model(resolved_model) is None:
        raise AppError("Model not found in registry.", status_code=400)
    return normalized_provider, resolved_model


def _ensure_subagent(agent_id: str) -> None:
    """Reject LLM preference overrides for the orchestrator agent."""
    agent = get_agent(agent_id)
    if agent.is_orchestrator:
        raise AppError(
            "Orchestrator model is configured in Chat preferences, not per-agent overrides.",
            status_code=400,
        )


async def build_llm_prefs_by_agent(
    user_id: int,
    *,
    global_provider: str,
    global_model_id: str,
) -> dict[str, tuple[str, str]]:
    """Map agent_id -> (provider, model_id) for every registered agent."""
    global_tuple = (global_provider, global_model_id)
    overrides: dict[str, tuple[str, str]] = {}

    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await agents_repository.list_agent_llm_preferences(conn, user_id)

    for row in rows:
        overrides[row["agent_id"]] = (row["llm_provider"], row["llm_model"])

    result: dict[str, tuple[str, str]] = {}
    for agent in list_agents():
        if agent.is_orchestrator:
            result[agent.id] = global_tuple
        else:
            result[agent.id] = overrides.get(agent.id, global_tuple)
    return result


async def get_effective_agent_llm_preferences(
    user_id: int,
    agent_id: str,
    *,
    global_provider: str,
    global_model_id: str,
) -> ResolvedLlm:
    """Effective LLM settings for one agent (override or inherited global)."""
    agent = get_agent(agent_id)
    if agent.is_orchestrator:
        return _resolved_from_provider_model(
            global_provider,
            global_model_id,
            has_override=False,
        )

    pool = get_pool()
    async with pool.acquire() as conn:
        row = await agents_repository.get_agent_llm_preferences(
            conn,
            user_id=user_id,
            agent_id=agent_id,
        )

    if row is None:
        return _resolved_from_provider_model(
            global_provider,
            global_model_id,
            has_override=False,
        )

    return _resolved_from_provider_model(
        row["llm_provider"],
        row["llm_model"],
        has_override=True,
    )


async def upsert_agent_llm_preferences(
    user_id: int,
    agent_id: str,
    *,
    provider: str,
    model_id: str,
) -> ResolvedLlm:
    """Persist a per-agent LLM override and return effective settings."""
    _ensure_subagent(agent_id)
    normalized_provider, resolved_model = validate_provider_model(provider, model_id)

    pool = get_pool()
    async with pool.acquire() as conn:
        await agents_repository.upsert_agent_llm_preferences(
            conn,
            user_id=user_id,
            agent_id=agent_id,
            provider=normalized_provider,
            model=resolved_model,
        )

    return _resolved_from_provider_model(
        normalized_provider,
        resolved_model,
        has_override=True,
    )


async def delete_agent_llm_preferences(
    user_id: int,
    agent_id: str,
    *,
    global_provider: str,
    global_model_id: str,
) -> ResolvedLlm:
    """Remove override; returns effective settings (global fallback)."""
    _ensure_subagent(agent_id)

    pool = get_pool()
    async with pool.acquire() as conn:
        await agents_repository.delete_agent_llm_preferences(
            conn,
            user_id=user_id,
            agent_id=agent_id,
        )

    return _resolved_from_provider_model(
        global_provider,
        global_model_id,
        has_override=False,
    )
