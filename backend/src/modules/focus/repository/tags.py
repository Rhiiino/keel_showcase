# keel_api/src/modules/focus/repository/tags.py

"""SQL access for focus tags and list-node tag assignments."""

from __future__ import annotations

import asyncpg

from core.tables import FOCUS_NODE_TAGS, FOCUS_TAGS

_TAG_COLUMNS = "id, user_id, name, color_hex, created_at, updated_at"



# ----- Focus tags
async def list_user_tags(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List tag rows for a user."""
    return await conn.fetch(
        f"""
        SELECT {_TAG_COLUMNS}
        FROM {FOCUS_TAGS}
        WHERE user_id = $1
        ORDER BY name ASC, id ASC
        """,
        user_id,
    )


async def get_user_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_id: int,
) -> asyncpg.Record | None:
    """Fetch one tag row owned by a user."""
    return await conn.fetchrow(
        f"""
        SELECT {_TAG_COLUMNS}
        FROM {FOCUS_TAGS}
        WHERE id = $1 AND user_id = $2
        """,
        tag_id,
        user_id,
    )


async def insert_user_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    name: str,
    color_hex: str,
) -> asyncpg.Record:
    """Insert a new user tag row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {FOCUS_TAGS} (user_id, name, color_hex)
        VALUES ($1, $2, $3)
        RETURNING {_TAG_COLUMNS}
        """,
        user_id,
        name,
        color_hex,
    )
    if row is None:
        raise RuntimeError("Failed to insert focus tag.")
    return row


async def update_user_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_id: int,
    name: str | None,
    color_hex: str | None,
) -> asyncpg.Record | None:
    """Update one user tag row."""
    return await conn.fetchrow(
        f"""
        UPDATE {FOCUS_TAGS}
        SET
            name = COALESCE($3, name),
            color_hex = COALESCE($4, color_hex),
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING {_TAG_COLUMNS}
        """,
        tag_id,
        user_id,
        name,
        color_hex,
    )


async def delete_user_tag(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_id: int,
) -> bool:
    """Delete one user tag row."""
    result = await conn.execute(
        f"""
        DELETE FROM {FOCUS_TAGS}
        WHERE id = $1 AND user_id = $2
        """,
        tag_id,
        user_id,
    )
    return result.endswith("1")


async def count_owned_tags(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_ids: list[int],
) -> int:
    """Count how many tag ids belong to a user."""
    if not tag_ids:
        return 0
    return await conn.fetchval(
        f"""
        SELECT COUNT(*)
        FROM {FOCUS_TAGS}
        WHERE user_id = $1 AND id = ANY($2::int[])
        """,
        user_id,
        tag_ids,
    )



# ----- List node tag assignments
async def fetch_tags_for_nodes(
    conn: asyncpg.Connection,
    node_ids: list[int],
) -> dict[int, list[asyncpg.Record]]:
    """Load tags grouped by list node id."""
    if not node_ids:
        return {}
    rows = await conn.fetch(
        f"""
        SELECT
            fnt.node_id,
            t.id,
            t.name,
            t.color_hex
        FROM {FOCUS_NODE_TAGS} fnt
        INNER JOIN {FOCUS_TAGS} t ON t.id = fnt.tag_id
        WHERE fnt.node_id = ANY($1::int[])
        ORDER BY t.name ASC, t.id ASC
        """,
        node_ids,
    )
    grouped: dict[int, list[asyncpg.Record]] = {node_id: [] for node_id in node_ids}
    for row in rows:
        grouped[row["node_id"]].append(row)
    return grouped


async def replace_node_tags(
    conn: asyncpg.Connection,
    *,
    node_id: int,
    tag_ids: list[int],
) -> None:
    """Replace tag associations for a list node."""
    await conn.execute(
        f"""
        DELETE FROM {FOCUS_NODE_TAGS}
        WHERE node_id = $1
        """,
        node_id,
    )
    if not tag_ids:
        return
    await conn.executemany(
        f"""
        INSERT INTO {FOCUS_NODE_TAGS} (node_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        """,
        [(node_id, tag_id) for tag_id in tag_ids],
    )
