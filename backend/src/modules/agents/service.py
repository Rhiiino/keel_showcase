# stack_sandbox/backend/src/modules/subagents/service.py
"""Subagent catalog, system-prompt preview, and catalog admin writes."""

from __future__ import annotations

from core.database import get_pool
from core.errors import AppError
from llm.agents.contracts import AgentDefinition
from llm.catalog import reload_catalog_cache
from llm.catalog.cache import get_catalog_cache
from modules.catalog import config as catalog_config
from modules.catalog import repository as catalog_repository
from modules.agents.schemas import AgentMediaPublic
from llm.agents.llm_prefs import (
    ResolvedLlm,
    delete_agent_llm_preferences,
    get_effective_agent_llm_preferences,
    upsert_agent_llm_preferences,
)
from llm.agents.registry import get_agent, list_agents
from llm.prompts.registry import get_system_prompt, get_system_prompt_sections
from llm.tokenization.estimate import count_context_usage, count_tool_token_breakdown
from llm.tools.assignments import get_tool_categories_for_agent
from llm.tools.manifest import build_tool_manifest_for_agent
from llm.tools.registry import TOOL_DEFINITIONS
from modules.chat import service as chat_service
from modules.chat.service import resolve_user_llm
from modules.agents.schemas import (
    AgentContextUsageResponse,
    AgentLlmPreferencesPublic,
    AgentLlmPreferencesUpdate,
    AgentSummary,
    AgentSystemPromptResponse,
    AgentSystemPromptUpdate,
    AgentUpdate,
    SystemPromptSectionPublic,
    ToolSummary,
    ToolTokenUsage,
)

EDITABLE_PROMPT_SECTION_KEYS = frozenset({
    "identity",
    "purpose",
    "guidelines",
    "domain_reference",
    "tool_guidance",
    "safety",
})

REQUIRED_PROMPT_SECTION_KEYS = frozenset({
    "identity",
    "purpose",
    "guidelines",
    "domain_reference",
    "safety",
})


def _media_for_agent(agent_id: str) -> list[AgentMediaPublic]:
    """Return catalog media URLs for an agent."""
    cache = get_catalog_cache()
    cache.require_loaded()
    prefix = catalog_config.ROUTE_PREFIX + catalog_config.MEDIA_PATH
    return [
        AgentMediaPublic(
            media_kind=item.media_kind,
            role=item.role,
            mime_type=item.mime_type,
            url=f"{prefix}/{item.storage_key}",
        )
        for item in cache.catalog_media
        if item.agent_key == agent_id
    ]


def _tool_summaries_for_agent(agent_id: str) -> list[ToolSummary]:
    """Return sorted tool metadata for an agent's assigned categories."""
    allowed = get_tool_categories_for_agent(agent_id)
    summaries = [
        ToolSummary(
            name=definition.name,
            category=definition.category,
            description=definition.description.split("\n", maxsplit=1)[0].strip(),
        )
        for definition in TOOL_DEFINITIONS.values()
        if definition.category in allowed
    ]
    return sorted(summaries, key=lambda tool: (tool.category, tool.name))


def _agent_summary_for_id(agent_id: str) -> AgentSummary:
    """Return one agent summary from the loaded registry."""
    agent = get_agent(agent_id)
    return AgentSummary(
        id=agent.id,
        display_name=agent.display_name,
        description=agent.description,
        system_prompt_key=agent.system_prompt_key,
        tool_categories=sorted(agent.tool_categories),
        tools=_tool_summaries_for_agent(agent.id),
        is_orchestrator=agent.is_orchestrator,
        delegates_to=sorted(agent.delegates_to),
        media=_media_for_agent(agent.id),
    )


def list_agent_summaries() -> list[AgentSummary]:
    """Return metadata for every registered agent."""

    def sort_key(agent: AgentDefinition) -> tuple[int, str]:
        """Sort orchestrators first, then by display name."""
        return (0 if agent.is_orchestrator else 1, agent.display_name.lower())

    sorted_agents = sorted(list_agents(), key=sort_key)

    return [
        AgentSummary(
            id=agent.id,
            display_name=agent.display_name,
            description=agent.description,
            system_prompt_key=agent.system_prompt_key,
            tool_categories=sorted(agent.tool_categories),
            tools=_tool_summaries_for_agent(agent.id),
            is_orchestrator=agent.is_orchestrator,
            delegates_to=sorted(agent.delegates_to),
            media=_media_for_agent(agent.id),
        )
        for agent in sorted_agents
    ]


def _to_preferences_public(agent_id: str, resolved: ResolvedLlm) -> AgentLlmPreferencesPublic:
    """Map resolved LLM prefs to the public API model."""
    return AgentLlmPreferencesPublic(
        agent_id=agent_id,
        provider=resolved.provider,
        model_id=resolved.model_id,
        max_context_window=resolved.max_context_window,
        has_override=resolved.has_override,
    )


async def get_agent_llm_preferences_for_user(
    user_id: int,
    agent_id: str,
) -> AgentLlmPreferencesPublic:
    """Effective LLM provider/model for an agent (override or global chat default)."""
    get_agent(agent_id)
    global_prefs = await resolve_user_llm(user_id)
    resolved = await get_effective_agent_llm_preferences(
        user_id,
        agent_id,
        global_provider=global_prefs.provider,
        global_model_id=global_prefs.model_id,
    )
    return _to_preferences_public(agent_id, resolved)


async def update_agent_llm_preferences_for_user(
    user_id: int,
    agent_id: str,
    payload: AgentLlmPreferencesUpdate,
) -> AgentLlmPreferencesPublic:
    """Save per-sub-agent LLM provider/model override for a user."""
    resolved = await upsert_agent_llm_preferences(
        user_id,
        agent_id,
        provider=payload.provider,
        model_id=payload.model_id,
    )
    return _to_preferences_public(agent_id, resolved)


async def clear_agent_llm_preferences_for_user(
    user_id: int,
    agent_id: str,
) -> AgentLlmPreferencesPublic:
    """Clear per-sub-agent override so global chat preferences apply."""
    global_prefs = await resolve_user_llm(user_id)
    resolved = await delete_agent_llm_preferences(
        user_id,
        agent_id,
        global_provider=global_prefs.provider,
        global_model_id=global_prefs.model_id,
    )
    return _to_preferences_public(agent_id, resolved)


async def get_agent_system_prompt_for_user(
    user_id: int,
    agent_id: str,
) -> AgentSystemPromptResponse:
    """Return the composed system prompt including the user's active chat rules."""
    agent = get_agent(agent_id)
    rules_block = await chat_service.get_rules_block_for_agent(user_id, agent_id)
    sections = get_system_prompt_sections(agent.id, rules_block=rules_block)
    return AgentSystemPromptResponse(
        agent_id=agent.id,
        system_prompt=get_system_prompt(agent.id, rules_block=rules_block),
        sections=[
            SystemPromptSectionPublic(
                key=section.key,
                label=section.label,
                content=section.content,
                editable=section.key in EDITABLE_PROMPT_SECTION_KEYS,
            )
            for section in sections
        ],
    )


async def update_agent_for_user(
    agent_id: str,
    payload: AgentUpdate,
) -> AgentSummary:
    """Update agent metadata and/or tool category grants, then reload the catalog cache."""
    agent = get_agent(agent_id)
    has_metadata = payload.display_name is not None or payload.description is not None
    has_categories = payload.tool_categories is not None

    if not has_metadata and not has_categories:
        return _agent_summary_for_id(agent_id)

    if has_categories:
        categories = payload.tool_categories or []
        if not categories:
            raise AppError("At least one tool category is required.", status_code=400)
        cache = get_catalog_cache()
        cache.require_loaded()
        unknown = sorted(set(categories) - set(cache.tool_categories.keys()))
        if unknown:
            raise AppError(
                f"Unknown tool categories: {', '.join(unknown)}",
                status_code=400,
            )

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            if has_metadata:
                row = await catalog_repository.update_agent_metadata(
                    conn,
                    agent_key=agent.id,
                    display_name=payload.display_name,
                    description=payload.description,
                )
                if row is None:
                    raise AppError(f"Agent {agent_id!r} not found.", status_code=404)

            if has_categories:
                await catalog_repository.replace_agent_tool_categories(
                    conn,
                    agent_key=agent.id,
                    category_keys=list(payload.tool_categories or []),
                )

    await reload_catalog_cache()
    return _agent_summary_for_id(agent_id)


async def update_agent_system_prompt_for_user(
    user_id: int,
    agent_id: str,
    payload: AgentSystemPromptUpdate,
) -> AgentSystemPromptResponse:
    """Update DB-backed system prompt sections for an agent, then reload the catalog cache."""
    agent = get_agent(agent_id)
    if not payload.sections:
        return await get_agent_system_prompt_for_user(user_id, agent_id)

    section_updates: dict[str, str] = {}
    for section in payload.sections:
        if section.key not in EDITABLE_PROMPT_SECTION_KEYS:
            raise AppError(
                f"System prompt section {section.key!r} is not editable.",
                status_code=400,
            )
        content = section.content.strip()
        if section.key in REQUIRED_PROMPT_SECTION_KEYS and not content:
            raise AppError(
                f"System prompt section {section.key!r} cannot be empty.",
                status_code=400,
            )
        section_updates[section.key] = section.content

    pool = get_pool()
    async with pool.acquire() as conn:
        row = await catalog_repository.update_system_prompt_sections(
            conn,
            prompt_key=agent.system_prompt_key,
            identity=section_updates.get("identity"),
            purpose=section_updates.get("purpose"),
            guidelines=section_updates.get("guidelines"),
            domain_reference=section_updates.get("domain_reference"),
            tool_guidance=section_updates.get("tool_guidance"),
            safety=section_updates.get("safety"),
        )
        if row is None:
            raise AppError(
                f"No system prompt registered for key {agent.system_prompt_key!r}",
                status_code=404,
            )

    await reload_catalog_cache()
    return await get_agent_system_prompt_for_user(user_id, agent_id)


async def get_agent_context_usage_for_user(
    user_id: int,
    agent_id: str,
) -> AgentContextUsageResponse:
    """Estimate input tokens for an agent's system prompt and tool manifest."""
    agent = get_agent(agent_id)
    global_prefs = await resolve_user_llm(user_id)
    resolved = await get_effective_agent_llm_preferences(
        user_id,
        agent_id,
        global_provider=global_prefs.provider,
        global_model_id=global_prefs.model_id,
    )

    rules_block = await chat_service.get_rules_block_for_agent(user_id, agent_id)
    system_prompt = get_system_prompt(agent.id, rules_block=rules_block)
    tools = build_tool_manifest_for_agent(agent_id)

    system_tokens, tools_tokens, is_estimate = count_context_usage(
        system_prompt=system_prompt,
        tools=tools,
        provider=resolved.provider,
        model_id=resolved.model_id,
    )
    breakdown, breakdown_estimate = count_tool_token_breakdown(
        tools,
        resolved.provider,
        resolved.model_id,
    )

    return AgentContextUsageResponse(
        agent_id=agent.id,
        provider=resolved.provider,
        model_id=resolved.model_id,
        max_context_window=resolved.max_context_window,
        system_prompt_tokens=system_tokens,
        tools_tokens=tools_tokens,
        total_tokens=system_tokens + tools_tokens,
        tool_count=len(tools),
        tool_breakdown=[
            ToolTokenUsage(name=entry.name, category=entry.category, tokens=entry.tokens)
            for entry in breakdown
        ],
        is_estimate=is_estimate or breakdown_estimate,
    )
