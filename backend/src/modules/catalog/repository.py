# stack_sandbox/backend/src/modules/catalog/repository.py

"""SQL access for catalog admin writes."""

from __future__ import annotations

import asyncpg

from core.tables import AGENTS, AGENT_TOOL_CATEGORIES, SYSTEM_PROMPTS, TOOL_CATEGORIES


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
