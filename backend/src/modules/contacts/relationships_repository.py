# stack_sandbox/backend/src/modules/contacts/relationships_repository.py

"""SQL access for contact relationships."""

from __future__ import annotations

import asyncpg

from core.tables import CONTACT_RELATIONSHIPS, CONTACTS

_COLUMNS = """
    r.id,
    r.user_id,
    r.from_contact_id,
    r.to_contact_id,
    fc.first_name AS from_first_name,
    fc.last_name AS from_last_name,
    tc.first_name AS to_first_name,
    tc.last_name AS to_last_name,
    r.relationship_type,
    r.created_at,
    r.updated_at
"""



# ----- Contact relationships table operations
async def list_relationships(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List all contact relationships for one user."""
    return await conn.fetch(
        f"""
        SELECT {_COLUMNS}
        FROM {CONTACT_RELATIONSHIPS} r
        JOIN {CONTACTS} fc ON fc.id = r.from_contact_id AND fc.user_id = r.user_id
        JOIN {CONTACTS} tc ON tc.id = r.to_contact_id AND tc.user_id = r.user_id
        WHERE r.user_id = $1
        ORDER BY r.id ASC
        """,
        user_id,
    )


async def list_relationships_for_contact(
    conn: asyncpg.Connection,
    user_id: int,
    contact_id: int,
) -> list[asyncpg.Record]:
    """List relationships where the contact appears on either end."""
    return await conn.fetch(
        f"""
        SELECT {_COLUMNS}
        FROM {CONTACT_RELATIONSHIPS} r
        JOIN {CONTACTS} fc ON fc.id = r.from_contact_id AND fc.user_id = r.user_id
        JOIN {CONTACTS} tc ON tc.id = r.to_contact_id AND tc.user_id = r.user_id
        WHERE r.user_id = $1
          AND (r.from_contact_id = $2 OR r.to_contact_id = $2)
        ORDER BY r.id ASC
        """,
        user_id,
        contact_id,
    )


async def get_relationship_by_id(
    conn: asyncpg.Connection,
    user_id: int,
    relationship_id: int,
) -> asyncpg.Record | None:
    """Fetch one relationship by id for one user."""
    return await conn.fetchrow(
        f"""
        SELECT {_COLUMNS}
        FROM {CONTACT_RELATIONSHIPS} r
        JOIN {CONTACTS} fc ON fc.id = r.from_contact_id AND fc.user_id = r.user_id
        JOIN {CONTACTS} tc ON tc.id = r.to_contact_id AND tc.user_id = r.user_id
        WHERE r.id = $1 AND r.user_id = $2
        """,
        relationship_id,
        user_id,
    )


async def insert_relationship(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    from_contact_id: int,
    to_contact_id: int,
    relationship_type: str,
) -> asyncpg.Record:
    """Insert a new relationship row for one user."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {CONTACT_RELATIONSHIPS} (
            user_id,
            from_contact_id,
            to_contact_id,
            relationship_type
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, from_contact_id, to_contact_id, relationship_type, created_at, updated_at
        """,
        user_id,
        from_contact_id,
        to_contact_id,
        relationship_type,
    )
    assert row is not None
    return await get_relationship_by_id(conn, user_id, row["id"])  # type: ignore[arg-type]


async def update_relationship(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    relationship_id: int,
    from_contact_id: int,
    to_contact_id: int,
    relationship_type: str,
) -> asyncpg.Record | None:
    """Update one relationship row for one user."""
    row = await conn.fetchrow(
        f"""
        UPDATE {CONTACT_RELATIONSHIPS}
        SET
            from_contact_id = $3,
            to_contact_id = $4,
            relationship_type = $5,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, from_contact_id, to_contact_id, relationship_type, created_at, updated_at
        """,
        relationship_id,
        user_id,
        from_contact_id,
        to_contact_id,
        relationship_type,
    )
    if row is None:
        return None
    return await get_relationship_by_id(conn, user_id, row["id"])  # type: ignore[arg-type]


async def delete_relationship(
    conn: asyncpg.Connection,
    user_id: int,
    relationship_id: int,
) -> bool:
    """Delete one relationship row for one user."""
    result = await conn.execute(
        f"DELETE FROM {CONTACT_RELATIONSHIPS} WHERE id = $1 AND user_id = $2",
        relationship_id,
        user_id,
    )
    return result.endswith("1")


async def list_relationships_for_group(
    conn: asyncpg.Connection,
    user_id: int,
    member_ids: list[int],
) -> list[asyncpg.Record]:
    """List genealogical edges where both endpoints are in member_ids."""
    if not member_ids:
        return []
    return await conn.fetch(
        f"""
        SELECT
            r.id,
            r.from_contact_id,
            r.to_contact_id,
            r.relationship_type
        FROM {CONTACT_RELATIONSHIPS} r
        WHERE r.user_id = $1
          AND r.from_contact_id = ANY($2::int[])
          AND r.to_contact_id = ANY($2::int[])
          AND r.relationship_type = ANY($3::text[])
        ORDER BY r.id ASC
        """,
        user_id,
        member_ids,
        list({"spouse", "parent", "sibling"}),
    )


async def list_genealogical_relationships_touching(
    conn: asyncpg.Connection,
    user_id: int,
    member_ids: list[int],
) -> list[asyncpg.Record]:
    """List genealogical edges where at least one endpoint is in member_ids."""
    if not member_ids:
        return []
    return await conn.fetch(
        f"""
        SELECT
            r.id,
            r.from_contact_id,
            r.to_contact_id,
            r.relationship_type
        FROM {CONTACT_RELATIONSHIPS} r
        WHERE r.user_id = $1
          AND (r.from_contact_id = ANY($2::int[]) OR r.to_contact_id = ANY($2::int[]))
          AND r.relationship_type = ANY($3::text[])
        ORDER BY r.id ASC
        """,
        user_id,
        member_ids,
        list({"spouse", "parent", "sibling"}),
    )
