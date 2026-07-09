# keel_api/src/modules/contacts/tags_repository.py

"""SQL access for contact tags and contact-tag assignments."""

from __future__ import annotations

import asyncpg

from core.tables import CONTACTS, CONTACT_TAG_ASSIGNMENTS, CONTACT_TAGS

_TAG_COLUMNS = "id, user_id, name, color_hex, created_at, updated_at"


async def list_user_tags(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List tag rows for a user."""
    return await conn.fetch(
        f"""
        SELECT
            t.id,
            t.user_id,
            t.name,
            t.color_hex,
            t.created_at,
            t.updated_at,
            COUNT(DISTINCT cta.contact_id)::int AS contact_count
        FROM {CONTACT_TAGS} t
        LEFT JOIN {CONTACT_TAG_ASSIGNMENTS} cta ON cta.tag_id = t.id
        LEFT JOIN {CONTACTS} c ON c.id = cta.contact_id AND c.user_id = t.user_id
        WHERE t.user_id = $1
        GROUP BY t.id, t.user_id, t.name, t.color_hex, t.created_at, t.updated_at
        ORDER BY t.name ASC, t.id ASC
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
        FROM {CONTACT_TAGS}
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
        INSERT INTO {CONTACT_TAGS} (user_id, name, color_hex)
        VALUES ($1, $2, $3)
        RETURNING {_TAG_COLUMNS}
        """,
        user_id,
        name,
        color_hex,
    )
    if row is None:
        raise RuntimeError("Failed to insert contact tag.")
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
        UPDATE {CONTACT_TAGS}
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
        DELETE FROM {CONTACT_TAGS}
        WHERE id = $1 AND user_id = $2
        """,
        tag_id,
        user_id,
    )
    return result.endswith("1")


async def fetch_tags_for_contacts(
    conn: asyncpg.Connection,
    contact_ids: list[int],
) -> dict[int, list[asyncpg.Record]]:
    """Load tags grouped by contact id."""
    if not contact_ids:
        return {}

    rows = await conn.fetch(
        f"""
        SELECT
            cta.contact_id,
            t.id,
            t.name,
            t.color_hex
        FROM {CONTACT_TAG_ASSIGNMENTS} cta
        INNER JOIN {CONTACT_TAGS} t ON t.id = cta.tag_id
        WHERE cta.contact_id = ANY($1::int[])
        ORDER BY t.name ASC, t.id ASC
        """,
        contact_ids,
    )

    grouped: dict[int, list[asyncpg.Record]] = {contact_id: [] for contact_id in contact_ids}
    for row in rows:
        grouped[row["contact_id"]].append(row)
    return grouped


async def replace_contact_tags(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    contact_id: int,
    tag_ids: list[int],
) -> None:
    """Replace tag associations for a user-owned contact."""
    owned = await conn.fetchval(
        f"SELECT 1 FROM {CONTACTS} WHERE id = $1 AND user_id = $2",
        contact_id,
        user_id,
    )
    if not owned:
        raise RuntimeError("Contact not found for user.")

    await conn.execute(
        f"""
        DELETE FROM {CONTACT_TAG_ASSIGNMENTS}
        WHERE contact_id = $1
        """,
        contact_id,
    )

    if not tag_ids:
        return

    await conn.executemany(
        f"""
        INSERT INTO {CONTACT_TAG_ASSIGNMENTS} (contact_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        """,
        [(contact_id, tag_id) for tag_id in tag_ids],
    )


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
        FROM {CONTACT_TAGS}
        WHERE user_id = $1 AND id = ANY($2::int[])
        """,
        user_id,
        tag_ids,
    )
