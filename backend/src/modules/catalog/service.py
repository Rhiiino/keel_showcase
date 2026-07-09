# stack_sandbox/backend/src/modules/catalog/service.py

"""Read-only catalog assembly from the in-memory cache."""

from __future__ import annotations

from llm.agents.registry import get_agent, list_agents
from llm.catalog.cache import CatalogMediaEntry, get_catalog_cache
from llm.tools.assignments import get_tool_categories_for_agent
from llm.tools.registry import TOOL_DEFINITIONS
from modules.catalog import config
from modules.catalog.schemas import (
    AgentPublic,
    CatalogMediaPublic,
    CatalogReloadResponse,
    ModalityPublic,
    ModelPublic,
    ProviderPublic,
    SystemPromptPublic,
    ToolCategoryPublic,
    ToolPublic,
)
from llm.catalog import reload_catalog_cache


def _media_url(storage_key: str) -> str:
    """Build the public URL for a catalog media storage key."""
    return f"{config.ROUTE_PREFIX}{config.MEDIA_PATH}/{storage_key}"


def _media_for_agent(agent_key: str) -> list[CatalogMediaPublic]:
    """Return catalog media entries linked to an agent."""
    cache = get_catalog_cache()
    return [
        CatalogMediaPublic(
            id=item.id,
            media_kind=item.media_kind,
            role=item.role,
            mime_type=item.mime_type,
            url=_media_url(item.storage_key),
            sort_order=item.sort_order,
        )
        for item in cache.catalog_media
        if item.agent_key == agent_key
    ]


def _media_for_tool_category(category_key: str) -> list[CatalogMediaPublic]:
    """Return catalog media entries linked to a tool category."""
    cache = get_catalog_cache()
    return [
        CatalogMediaPublic(
            id=item.id,
            media_kind=item.media_kind,
            role=item.role,
            mime_type=item.mime_type,
            url=_media_url(item.storage_key),
            sort_order=item.sort_order,
        )
        for item in cache.catalog_media
        if item.tool_category_key == category_key
    ]


def _media_for_provider(provider_key: str) -> list[CatalogMediaPublic]:
    """Return catalog media entries linked to a provider."""
    cache = get_catalog_cache()
    return [
        CatalogMediaPublic(
            id=item.id,
            media_kind=item.media_kind,
            role=item.role,
            mime_type=item.mime_type,
            url=_media_url(item.storage_key),
            sort_order=item.sort_order,
        )
        for item in cache.catalog_media
        if item.provider_key == provider_key
    ]


def list_modalities() -> list[ModalityPublic]:
    """Return all modalities from the catalog cache."""
    cache = get_catalog_cache()
    cache.require_loaded()
    return [
        ModalityPublic(
            key=row["key"],
            display_name=row["display_name"],
            description=row["description"],
            sort_order=row["sort_order"],
        )
        for row in sorted(
            cache.modalities.values(),
            key=lambda r: (r["sort_order"], r["key"]),
        )
    ]


def list_providers() -> list[ProviderPublic]:
    """Return all providers from the catalog cache."""
    cache = get_catalog_cache()
    cache.require_loaded()
    return [
        ProviderPublic(
            key=entry.key,
            display_name=entry.display_name,
            base_url=entry.base_url,
            is_enabled=entry.is_enabled,
            sort_order=entry.sort_order,
            config=entry.config,
            media=_media_for_provider(entry.key),
        )
        for entry in sorted(cache.providers.values(), key=lambda p: (p.sort_order, p.key))
    ]


def list_models(*, modality_key: str | None = None) -> list[ModelPublic]:
    """Return catalog models, optionally filtered by modality key."""
    cache = get_catalog_cache()
    cache.require_loaded()
    models = cache.models.values()
    if modality_key:
        models = [m for m in models if m.modality_key == modality_key]
    return [
        ModelPublic(
            id=entry.id,
            provider=entry.provider,
            modality_key=entry.modality_key,
            display_name=entry.display_name,
            max_context_window=entry.max_context_window,
            input_price_per_1m=entry.input_price_per_1m,
            output_price_per_1m=entry.output_price_per_1m,
            capabilities=entry.capabilities,
            is_enabled=entry.is_enabled,
            is_provider_default=entry.is_provider_default,
            sort_order=0,
        )
        for entry in sorted(models, key=lambda m: (m.provider, m.id))
    ]


def list_tool_categories() -> list[ToolCategoryPublic]:
    """Return all tool categories from the catalog cache."""
    cache = get_catalog_cache()
    cache.require_loaded()
    return [
        ToolCategoryPublic(
            key=entry.key,
            display_name=entry.display_name,
            description=entry.description,
            sort_order=entry.sort_order,
            media=_media_for_tool_category(entry.key),
        )
        for entry in sorted(
            cache.tool_categories.values(),
            key=lambda c: (c.sort_order, c.key),
        )
    ]


def list_tools() -> list[ToolPublic]:
    """Return all registered tool definitions."""
    cache = get_catalog_cache()
    cache.require_loaded()
    return [
        ToolPublic(
            name=definition.name,
            category=definition.category,
            description=definition.description,
            parameters=definition.parameters,
            returns=definition.returns,
            examples=definition.examples,
            is_enabled=True,
        )
        for definition in sorted(
            TOOL_DEFINITIONS.values(),
            key=lambda d: (d.category, d.name),
        )
    ]


def list_system_prompts() -> list[SystemPromptPublic]:
    """Return all system prompt templates from the catalog cache."""
    cache = get_catalog_cache()
    cache.require_loaded()
    return [
        SystemPromptPublic(
            key=entry.key,
            display_name=entry.display_name,
            identity=entry.identity,
            purpose=entry.purpose,
            guidelines=entry.guidelines,
            domain_reference=entry.domain_reference,
            tool_guidance=entry.tool_guidance,
            safety=entry.safety,
            sort_order=0,
        )
        for entry in sorted(cache.system_prompts.values(), key=lambda p: p.key)
    ]


def list_agents() -> list[AgentPublic]:
    """Return all agents from the catalog cache."""
    cache = get_catalog_cache()
    cache.require_loaded()

    def sort_key(agent_id: str) -> tuple[int, str]:
        """Sort orchestrators first, then by display name."""
        agent = cache.agents[agent_id]
        return (0 if agent.is_orchestrator else 1, agent.display_name.lower())

    result: list[AgentPublic] = []
    for agent_id in sorted(cache.agent_order, key=sort_key):
        agent = cache.agents[agent_id]
        result.append(
            AgentPublic(
                id=agent.id,
                display_name=agent.display_name,
                description=agent.description,
                system_prompt_key=agent.system_prompt_key,
                tool_categories=sorted(agent.tool_categories),
                is_orchestrator=agent.is_orchestrator,
                is_enabled=True,
                delegates_to=sorted(agent.delegates_to),
                sort_order=0,
                media=_media_for_agent(agent.id),
            )
        )
    return result


def get_agent_public(agent_id: str) -> AgentPublic:
    """Return one agent's public catalog record."""
    agent = get_agent(agent_id)
    cache = get_catalog_cache()
    return AgentPublic(
        id=agent.id,
        display_name=agent.display_name,
        description=agent.description,
        system_prompt_key=agent.system_prompt_key,
        tool_categories=sorted(agent.tool_categories),
        is_orchestrator=agent.is_orchestrator,
        is_enabled=True,
        delegates_to=sorted(agent.delegates_to),
        sort_order=0,
        media=_media_for_agent(agent.id),
    )


async def reload_catalog() -> CatalogReloadResponse:
    """Reload the catalog cache and return entity counts."""
    cache = await reload_catalog_cache()
    return CatalogReloadResponse(
        agents=len(cache.agents),
        tools=len(cache.tools),
        models=len(cache.models),
        providers=len(cache.providers),
    )
