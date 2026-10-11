# stack_sandbox/backend/src/llm/catalog/cache.py

"""In-memory catalog cache loaded from Postgres at startup."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import Any

import asyncpg

from core.database import get_pool
from core.errors import AppError
from llm.agents.contracts import AgentDefinition
from llm.catalog import repository
from llm.tools.contracts import ToolDefinition
from llm.tools.executors import TOOL_EXECUTORS

logger = logging.getLogger(__name__)

KNOWN_PROVIDER_BINDINGS: frozenset[str] = frozenset({"openai", "anthropic", "moonshot"})

def _as_dict(value: Any) -> dict[str, Any]:
    """Coerce a JSON or dict database value into a plain dict."""
    if value is None:
        return {}
    if isinstance(value, dict):
        return dict(value)
    if isinstance(value, str):
        parsed = json.loads(value)
        return dict(parsed) if isinstance(parsed, dict) else {}
    return {}


def _as_list(value: Any) -> list[Any]:
    """Coerce a JSON or list database value into a plain list."""
    if value is None:
        return []
    if isinstance(value, list):
        return list(value)
    if isinstance(value, str):
        parsed = json.loads(value)
        return list(parsed) if isinstance(parsed, list) else []
    return []


PROMPT_SECTION_ORDER: tuple[tuple[str, str | None], ...] = (
    ("identity", None),
    ("purpose", "Purpose"),
    ("guidelines", "Guidelines"),
    ("domain_reference", "Domain reference"),
    ("tool_guidance", "Tool guidance"),
    ("safety", "Safety"),
)


@dataclass(frozen=True)
class SystemPromptSection:
    key: str
    label: str | None
    content: str


def _strip_redundant_section_heading(text: str, heading: str | None) -> str:
    """Drop a leading heading line when it duplicates the DB column label."""
    if heading is None:
        return text.strip()
    stripped = text.strip()
    prefix = f"{heading}:"
    if stripped.casefold().startswith(prefix.casefold()):
        remainder = stripped[len(prefix) :].lstrip("\n").lstrip()
        return remainder or stripped
    return stripped


@dataclass(frozen=True)
class ModelEntry:
    id: str
    provider: str
    display_name: str
    max_context_window: int | None
    input_price_per_1m: float | None
    output_price_per_1m: float | None
    modality_key: str
    capabilities: dict[str, Any]
    is_enabled: bool
    is_provider_default: bool


@dataclass(frozen=True)
class ProviderEntry:
    id: int
    key: str
    display_name: str
    base_url: str | None
    is_enabled: bool
    sort_order: int
    config: dict[str, Any]


@dataclass(frozen=True)
class ToolCategoryEntry:
    id: int
    key: str
    display_name: str
    description: str
    sort_order: int


@dataclass(frozen=True)
class SystemPromptEntry:
    id: int
    key: str
    display_name: str
    identity: str
    purpose: str | None
    guidelines: str | None
    domain_reference: str | None
    tool_guidance: str | None
    safety: str | None

    def render_base(self) -> str:
        """Concatenate prompt sections into the base system prompt text."""
        parts: list[str] = []
        for section in sections_from_prompt_entry(self):
            if section.label is None:
                parts.append(section.content)
            else:
                parts.append(f"{section.label}:\n{section.content}")
        return "\n\n".join(parts)



def sections_from_prompt_entry(entry: SystemPromptEntry) -> list[SystemPromptSection]:
    """Return ordered DB-backed sections with column-derived display labels."""
    sections: list[SystemPromptSection] = []
    for attr, heading in PROMPT_SECTION_ORDER:
        raw = getattr(entry, attr)
        if not raw or not str(raw).strip():
            continue
        content = _strip_redundant_section_heading(str(raw), heading)
        if not content:
            continue
        sections.append(SystemPromptSection(key=attr, label=heading, content=content))
    return sections


@dataclass(frozen=True)
class CatalogMediaEntry:
    id: int
    media_kind: str
    role: str | None
    storage_key: str
    mime_type: str
    byte_size: int | None
    sort_order: int
    agent_key: str | None = None
    tool_category_key: str | None = None
    provider_key: str | None = None
    model_key: str | None = None


@dataclass
class CatalogCache:
    """Merged DB metadata + code bindings for synchronous runtime lookups."""

    modalities: dict[str, asyncpg.Record] = field(default_factory=dict)
    providers: dict[str, ProviderEntry] = field(default_factory=dict)
    models: dict[str, ModelEntry] = field(default_factory=dict)
    tool_categories: dict[str, ToolCategoryEntry] = field(default_factory=dict)
    tools: dict[str, ToolDefinition] = field(default_factory=dict)
    system_prompts: dict[str, SystemPromptEntry] = field(default_factory=dict)
    agents: dict[str, AgentDefinition] = field(default_factory=dict)
    agent_order: list[str] = field(default_factory=list)
    agent_tool_categories: dict[str, frozenset[str]] = field(default_factory=dict)
    agent_delegations: dict[str, frozenset[str]] = field(default_factory=dict)
    catalog_media: list[CatalogMediaEntry] = field(default_factory=list)
    _loaded: bool = False

    @property
    def is_loaded(self) -> bool:
        """Whether catalog rows have been loaded into memory."""
        return self._loaded

    def require_loaded(self) -> None:
        """Raise 503 when the catalog cache is not yet loaded."""
        if not self._loaded:
            raise AppError("Catalog cache is not loaded.", status_code=503)


_cache = CatalogCache()


def get_catalog_cache() -> CatalogCache:
    """Return the process-wide catalog cache singleton."""
    return _cache


def assemble_system_prompt_base(prompt_key: str) -> str:
    """Render the base system prompt for a prompt key."""
    cache = get_catalog_cache()
    cache.require_loaded()
    prompt = cache.system_prompts.get(prompt_key)
    if prompt is None:
        raise AppError(f"No system prompt registered for key {prompt_key!r}", status_code=500)
    return prompt.render_base()


async def load_catalog_cache() -> CatalogCache:
    """Load catalog rows from Postgres and bind code executors."""
    pool = get_pool()
    async with pool.acquire() as conn:
        return await _load_from_connection(conn)


async def reload_catalog_cache() -> CatalogCache:
    """Reload the global cache (after catalog CRUD writes)."""
    return await load_catalog_cache()


async def _load_from_connection(conn: asyncpg.Connection) -> CatalogCache:
    """Hydrate the global cache from SQL rows on one connection."""
    global _cache
    next_cache = CatalogCache()

    for row in await repository.fetch_modalities(conn):
        next_cache.modalities[row["key"]] = row

    for row in await repository.fetch_providers(conn):
        entry = ProviderEntry(
            id=row["id"],
            key=row["key"],
            display_name=row["display_name"],
            base_url=row["base_url"],
            is_enabled=row["is_enabled"],
            sort_order=row["sort_order"],
            config=_as_dict(row["config"]),
        )
        next_cache.providers[entry.key] = entry

    for row in await repository.fetch_models(conn):
        entry = ModelEntry(
            id=row["key"],
            provider=row["provider_key"],
            display_name=row["display_name"],
            max_context_window=row["max_context_window"],
            input_price_per_1m=float(row["input_price_per_1m"])
            if row["input_price_per_1m"] is not None
            else None,
            output_price_per_1m=float(row["output_price_per_1m"])
            if row["output_price_per_1m"] is not None
            else None,
            modality_key=row["modality_key"],
            capabilities=_as_dict(row["capabilities"]),
            is_enabled=row["is_enabled"],
            is_provider_default=row["is_provider_default"],
        )
        next_cache.models[entry.id] = entry

    for row in await repository.fetch_tool_categories(conn):
        entry = ToolCategoryEntry(
            id=row["id"],
            key=row["key"],
            display_name=row["display_name"],
            description=row["description"],
            sort_order=row["sort_order"],
        )
        next_cache.tool_categories[entry.key] = entry

    missing_executors: list[str] = []
    for row in await repository.fetch_tools(conn):
        if not row["is_enabled"]:
            continue
        name = row["name"]
        executor = TOOL_EXECUTORS.get(name)
        if executor is None:
            missing_executors.append(name)
            continue
        examples_raw = _as_list(row["examples"])
        next_cache.tools[name] = ToolDefinition(
            name=name,
            category=row["category_key"],
            description=row["description"],
            parameters=_as_dict(row["parameters"]),
            returns=row["returns"] or "",
            examples=[str(item) for item in examples_raw] or None,
            executor=executor,
        )
    if missing_executors:
        logger.warning(
            "Enabled catalog tools missing code executors: %s",
            ", ".join(sorted(missing_executors)),
        )

    for row in await repository.fetch_system_prompts(conn):
        entry = SystemPromptEntry(
            id=row["id"],
            key=row["key"],
            display_name=row["display_name"],
            identity=row["identity"],
            purpose=row["purpose"],
            guidelines=row["guidelines"],
            domain_reference=row["domain_reference"],
            tool_guidance=row["tool_guidance"],
            safety=row["safety"],
        )
        next_cache.system_prompts[entry.key] = entry

    grants: dict[str, set[str]] = {}
    for row in await repository.fetch_agent_tool_categories(conn):
        grants.setdefault(row["agent_key"], set()).add(row["category_key"])
    next_cache.agent_tool_categories = {
        agent_key: frozenset(categories) for agent_key, categories in grants.items()
    }

    delegations: dict[str, set[str]] = {}
    for row in await repository.fetch_agent_delegations(conn):
        delegations.setdefault(row["parent_key"], set()).add(row["child_key"])
    next_cache.agent_delegations = {
        parent_key: frozenset(children) for parent_key, children in delegations.items()
    }

    for row in await repository.fetch_agents(conn):
        if not row["is_enabled"]:
            continue
        agent_key = row["key"]
        prompt_key = row["system_prompt_key"] or agent_key
        if prompt_key not in next_cache.system_prompts:
            logger.warning("Agent %s references missing prompt %s", agent_key, prompt_key)
        agent = AgentDefinition(
            id=agent_key,
            display_name=row["display_name"],
            description=row["description"],
            system_prompt_key=prompt_key,
            tool_categories=next_cache.agent_tool_categories.get(agent_key, frozenset()),
            is_orchestrator=row["is_orchestrator"],
            delegates_to=next_cache.agent_delegations.get(agent_key, frozenset()),
        )
        next_cache.agents[agent_key] = agent
        next_cache.agent_order.append(agent_key)

    for row in await repository.fetch_catalog_media(conn):
        next_cache.catalog_media.append(
            CatalogMediaEntry(
                id=row["id"],
                media_kind=row["media_kind"],
                role=row["role"],
                storage_key=row["storage_key"],
                mime_type=row["mime_type"],
                byte_size=row["byte_size"],
                sort_order=row["sort_order"],
                agent_key=row["agent_key"],
                tool_category_key=row["tool_category_key"],
                provider_key=row["provider_key"],
                model_key=row["model_key"],
            )
        )

    for provider_key, provider in next_cache.providers.items():
        if provider.is_enabled and provider_key not in KNOWN_PROVIDER_BINDINGS:
            logger.warning("Enabled provider %s has no code binding", provider_key)

    next_cache._loaded = True
    _cache = next_cache

    from llm.tools.registry import refresh_tool_registry

    refresh_tool_registry()

    logger.info(
        "Catalog cache loaded: %d agents, %d tools, %d models, %d providers",
        len(_cache.agents),
        len(_cache.tools),
        len(_cache.models),
        len(_cache.providers),
    )
    return _cache
