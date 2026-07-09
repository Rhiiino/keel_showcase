# stack_sandbox/backend/src/modules/catalog/repository.py

"""SQL access for catalog admin writes."""

from __future__ import annotations

import asyncpg

from core.tables import (
    AGENTS,
    AGENT_DELEGATIONS,
    AGENT_TOOL_CATEGORIES,
    CATALOG_MEDIA,
    SYSTEM_PROMPTS,
    TOOL_CATEGORIES,
)


async def update_system_prompt_sections(
    conn: asyncpg.Connection,
    *,
    prompt_key: str,
    identity: str | None = None,
    purpose: str | None = None,
    guidelines: str | None = None,
    domain_reference: str | None = None,
    tool_guidance: str | None = None,
    safety: str | None = None,
) -> asyncpg.Record | None:
    """Update system prompt section fields for a prompt key."""
    sets: list[str] = ["updated_at = NOW()"]
    args: list[object] = []
    idx = 1

    def add(field: str, value: str | None) -> None:
        """Append a SET clause when the section value is not None."""
        nonlocal idx
        if value is not None:
            sets.append(f"{field} = ${idx}")
            args.append(value)
            idx += 1

    add("identity", identity)
    add("purpose", purpose)
    add("guidelines", guidelines)
    add("domain_reference", domain_reference)
    add("tool_guidance", tool_guidance)
    add("safety", safety)

    if len(sets) == 1:
        return await conn.fetchrow(
            f"SELECT * FROM {SYSTEM_PROMPTS} WHERE key = $1",
            prompt_key,
        )

    args.append(prompt_key)
    return await conn.fetchrow(
        f"""
        UPDATE {SYSTEM_PROMPTS}
        SET {", ".join(sets)}
        WHERE key = ${idx}
        RETURNING *
        """,
        *args,
    )



# ----- Agent metadata and tool category grants
async def update_agent_metadata(
    conn: asyncpg.Connection,
    *,
    agent_key: str,
    display_name: str | None = None,
    description: str | None = None,
) -> asyncpg.Record | None:
    """Update display name and/or description for an agent key."""
    sets: list[str] = ["updated_at = NOW()"]
    args: list[object] = []
    idx = 1

    def add(field: str, value: str | None) -> None:
        nonlocal idx
        if value is not None:
            sets.append(f"{field} = ${idx}")
            args.append(value)
            idx += 1

    add("display_name", display_name)
    add("description", description)

    if len(sets) == 1:
        return await conn.fetchrow(
            f"SELECT * FROM {AGENTS} WHERE key = $1",
            agent_key,
        )

    args.append(agent_key)
    return await conn.fetchrow(
        f"""
        UPDATE {AGENTS}
        SET {", ".join(sets)}
        WHERE key = ${idx}
        RETURNING *
        """,
        *args,
    )


async def fetch_tool_category_ids_by_keys(
    conn: asyncpg.Connection,
    category_keys: list[str],
) -> dict[str, int]:
    """Resolve tool category keys to database ids."""
    if not category_keys:
        return {}
    rows = await conn.fetch(
        f"""
        SELECT id, key
        FROM {TOOL_CATEGORIES}
        WHERE key = ANY($1::text[])
        """,
        category_keys,
    )
    return {row["key"]: row["id"] for row in rows}


async def replace_agent_tool_categories(
    conn: asyncpg.Connection,
    *,
    agent_key: str,
    category_keys: list[str],
) -> None:
    """Replace all tool category grants for an agent."""
    agent_row = await conn.fetchrow(
        f"SELECT id FROM {AGENTS} WHERE key = $1",
        agent_key,
    )
    if agent_row is None:
        return

    agent_id = agent_row["id"]
    await conn.execute(
        f"DELETE FROM {AGENT_TOOL_CATEGORIES} WHERE agent_id = $1",
        agent_id,
    )

    if not category_keys:
        return

    key_to_id = await fetch_tool_category_ids_by_keys(conn, category_keys)
    for category_key in category_keys:
        category_id = key_to_id.get(category_key)
        if category_id is None:
            continue
        await conn.execute(
            f"""
            INSERT INTO {AGENT_TOOL_CATEGORIES} (agent_id, category_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            """,
            agent_id,
            category_id,
        )


async def agent_key_exists(
    conn: asyncpg.Connection,
    agent_key: str,
) -> bool:
    """Return True when an agent key is already registered."""
    row = await conn.fetchrow(
        f"SELECT 1 FROM {AGENTS} WHERE key = $1",
        agent_key,
    )
    return row is not None


async def fetch_agent_row_by_key(
    conn: asyncpg.Connection,
    agent_key: str,
) -> asyncpg.Record | None:
    """Fetch one agent row by key."""
    return await conn.fetchrow(
        f"SELECT * FROM {AGENTS} WHERE key = $1",
        agent_key,
    )


async def fetch_next_subagent_sort_order(conn: asyncpg.Connection) -> int:
    """Return sort_order for a new sub-agent (after existing sub-agents)."""
    row = await conn.fetchrow(
        f"""
        SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order
        FROM {AGENTS}
        WHERE is_orchestrator = FALSE
        """
    )
    return int(row["next_order"]) if row else 1


async def insert_system_prompt(
    conn: asyncpg.Connection,
    *,
    key: str,
    display_name: str,
    identity: str,
    purpose: str,
    guidelines: str,
    domain_reference: str,
    tool_guidance: str | None,
    safety: str,
    sort_order: int = 0,
) -> asyncpg.Record:
    """Insert a new system prompt template."""
    return await conn.fetchrow(
        f"""
        INSERT INTO {SYSTEM_PROMPTS} (
            key,
            display_name,
            identity,
            purpose,
            guidelines,
            domain_reference,
            tool_guidance,
            safety,
            sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        """,
        key,
        display_name,
        identity,
        purpose,
        guidelines,
        domain_reference,
        tool_guidance,
        safety,
        sort_order,
    )


async def insert_agent(
    conn: asyncpg.Connection,
    *,
    key: str,
    display_name: str,
    description: str,
    system_prompt_id: int,
    is_orchestrator: bool = False,
    sort_order: int,
) -> asyncpg.Record:
    """Insert a new agent row."""
    return await conn.fetchrow(
        f"""
        INSERT INTO {AGENTS} (
            key,
            display_name,
            description,
            system_prompt_id,
            is_orchestrator,
            is_enabled,
            sort_order
        )
        VALUES ($1, $2, $3, $4, $5, TRUE, $6)
        RETURNING *
        """,
        key,
        display_name,
        description,
        system_prompt_id,
        is_orchestrator,
        sort_order,
    )


async def insert_agent_delegation(
    conn: asyncpg.Connection,
    *,
    parent_agent_id: int,
    child_agent_id: int,
) -> None:
    """Link a parent orchestrator agent to a child sub-agent."""
    await conn.execute(
        f"""
        INSERT INTO {AGENT_DELEGATIONS} (parent_agent_id, child_agent_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        """,
        parent_agent_id,
        child_agent_id,
    )


async def insert_catalog_media(
    conn: asyncpg.Connection,
    *,
    agent_id: int,
    media_kind: str,
    role: str,
    storage_key: str,
    mime_type: str,
    sort_order: int = 0,
) -> None:
    """Insert catalog media metadata for an agent."""
    await conn.execute(
        f"""
        INSERT INTO {CATALOG_MEDIA} (
            agent_id,
            tool_category_id,
            provider_id,
            model_id,
            media_kind,
            role,
            storage_key,
            mime_type,
            sort_order
        )
        VALUES ($1, NULL, NULL, NULL, $2, $3, $4, $5, $6)
        """,
        agent_id,
        media_kind,
        role,
        storage_key,
        mime_type,
        sort_order,
    )


async def replace_agent_catalog_media(
    conn: asyncpg.Connection,
    *,
    agent_id: int,
    media_kind: str,
    role: str,
    storage_key: str,
    mime_type: str,
) -> None:
    """Replace one agent catalog media row (tile image or turntable model)."""
    await conn.execute(
        f"""
        DELETE FROM {CATALOG_MEDIA}
        WHERE agent_id = $1 AND media_kind = $2 AND role = $3
        """,
        agent_id,
        media_kind,
        role,
    )
    await insert_catalog_media(
        conn,
        agent_id=agent_id,
        media_kind=media_kind,
        role=role,
        storage_key=storage_key,
        mime_type=mime_type,
    )
