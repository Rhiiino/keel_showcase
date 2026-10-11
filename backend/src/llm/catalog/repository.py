# stack_sandbox/backend/src/llm/catalog/repository.py

"""SQL loaders for the global intelligence catalog."""

from __future__ import annotations

import asyncpg

from core.tables import (
    AGENT_DELEGATIONS,
    AGENT_TOOL_CATEGORIES,
    AGENTS,
    CATALOG_MEDIA,
    MODEL_MODALITIES,
    MODEL_PROVIDERS,
    MODELS,
    SYSTEM_PROMPTS,
    TOOL_CATEGORIES,
    TOOLS,
)


async def fetch_modalities(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    """Load all model modality rows from Postgres."""
    return await conn.fetch(
        f"""
        SELECT key, display_name, description, sort_order
        FROM {MODEL_MODALITIES}
        ORDER BY sort_order, key
        """
    )


async def fetch_providers(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    """Load all LLM provider rows from Postgres."""
    return await conn.fetch(
        f"""
        SELECT id, key, display_name, base_url, is_enabled, sort_order, config
        FROM {MODEL_PROVIDERS}
        ORDER BY sort_order, id
        """
    )


async def fetch_models(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    """Load all model rows joined with provider keys."""
    return await conn.fetch(
        f"""
        SELECT
            m.id,
            m.key,
            m.display_name,
            m.modality_key,
            m.max_context_window,
            m.input_price_per_1m,
            m.output_price_per_1m,
            m.capabilities,
            m.is_enabled,
            m.is_provider_default,
            m.sort_order,
            p.key AS provider_key
        FROM {MODELS} m
        JOIN {MODEL_PROVIDERS} p ON p.id = m.provider_id
        ORDER BY p.sort_order, m.sort_order, m.id
        """
    )


async def fetch_tool_categories(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    """Load all tool category rows from Postgres."""
    return await conn.fetch(
        f"""
        SELECT id, key, display_name, description, sort_order
        FROM {TOOL_CATEGORIES}
        ORDER BY sort_order, id
        """
    )


async def fetch_tools(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    """Load all tool rows joined with category keys."""
    return await conn.fetch(
        f"""
        SELECT
            t.id,
            t.name,
            t.description,
            t.parameters,
            t.returns,
            t.examples,
            t.is_enabled,
            c.key AS category_key
        FROM {TOOLS} t
        JOIN {TOOL_CATEGORIES} c ON c.id = t.category_id
        ORDER BY c.sort_order, t.name
        """
    )


async def fetch_system_prompts(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    """Load all system prompt rows from Postgres."""
    return await conn.fetch(
        f"""
        SELECT
            id,
            key,
            display_name,
            identity,
            purpose,
            guidelines,
            domain_reference,
            tool_guidance,
            safety,
            sort_order
        FROM {SYSTEM_PROMPTS}
        ORDER BY sort_order, id
        """
    )


async def fetch_agents(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    """Load all agent rows with linked system prompt keys."""
    return await conn.fetch(
        f"""
        SELECT
            a.id,
            a.key,
            a.display_name,
            a.description,
            a.is_orchestrator,
            a.is_enabled,
            a.sort_order,
            sp.key AS system_prompt_key
        FROM {AGENTS} a
        LEFT JOIN {SYSTEM_PROMPTS} sp ON sp.id = a.system_prompt_id
        ORDER BY a.sort_order, a.id
        """
    )


async def fetch_agent_tool_categories(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    """Load agent-to-tool-category grant pairs."""
    return await conn.fetch(
        f"""
        SELECT a.key AS agent_key, c.key AS category_key
        FROM {AGENT_TOOL_CATEGORIES} atc
        JOIN {AGENTS} a ON a.id = atc.agent_id
        JOIN {TOOL_CATEGORIES} c ON c.id = atc.category_id
        """
    )


async def fetch_agent_delegations(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    """Load parent-to-child agent delegation pairs."""
    return await conn.fetch(
        f"""
        SELECT parent.key AS parent_key, child.key AS child_key
        FROM {AGENT_DELEGATIONS} d
        JOIN {AGENTS} parent ON parent.id = d.parent_agent_id
        JOIN {AGENTS} child ON child.id = d.child_agent_id
        """
    )


async def fetch_catalog_media(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    """Load catalog media rows with optional entity keys."""
    return await conn.fetch(
        f"""
        SELECT
            cm.id,
            cm.media_kind,
            cm.role,
            cm.storage_key,
            cm.mime_type,
            cm.byte_size,
            cm.sort_order,
            a.key AS agent_key,
            tc.key AS tool_category_key,
            p.key AS provider_key,
            m.key AS model_key
        FROM {CATALOG_MEDIA} cm
        LEFT JOIN {AGENTS} a ON a.id = cm.agent_id
        LEFT JOIN {TOOL_CATEGORIES} tc ON tc.id = cm.tool_category_id
        LEFT JOIN {MODEL_PROVIDERS} p ON p.id = cm.provider_id
        LEFT JOIN {MODELS} m ON m.id = cm.model_id
        ORDER BY cm.sort_order, cm.id
        """
    )
