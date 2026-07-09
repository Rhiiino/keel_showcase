# keel_api/src/modules/contacts/repository.py

"""SQL access for contacts."""

from __future__ import annotations

from datetime import date

import asyncpg

from core.tables import CONTACTS, USERS

_COLUMNS = """
    id,
    user_id,
    first_name,
    last_name,
    gender,
    birth_date,
    birth_date_year_known,
    death_date,
    notes,
    status,
    is_self,
    created_at,
    updated_at
"""



# ----- Contacts table operations
async def list_contacts(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List contacts for one user ordered by last name, first name, id."""
    return await conn.fetch(
        f"""
        SELECT {_COLUMNS}
        FROM {CONTACTS}
        WHERE user_id = $1
        ORDER BY
            NULLIF(trim(last_name), '') NULLS LAST,
            NULLIF(trim(first_name), '') NULLS LAST,
            id ASC
        """,
        user_id,
    )


async def get_contact_by_id(
    conn: asyncpg.Connection,
    user_id: int,
    contact_id: int,
) -> asyncpg.Record | None:
    """Fetch one contact owned by the user."""
    return await conn.fetchrow(
        f"""
        SELECT {_COLUMNS}
        FROM {CONTACTS}
        WHERE id = $1 AND user_id = $2
        """,
        contact_id,
        user_id,
    )


async def get_self_contact(
    conn: asyncpg.Connection,
    user_id: int,
) -> asyncpg.Record | None:
    """Fetch the self contact row for one user if it exists."""
    return await conn.fetchrow(
        f"""
        SELECT {_COLUMNS}
        FROM {CONTACTS}
        WHERE user_id = $1 AND is_self = TRUE
        LIMIT 1
        """,
        user_id,
    )


async def insert_contact(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    first_name: str | None,
    last_name: str | None,
    gender: str | None,
    birth_date: date | None,
    birth_date_year_known: bool,
    death_date: date | None,
    notes: str,
    status: str,
    is_self: bool = False,
) -> asyncpg.Record:
    """Insert a new contact row for one user."""
    return await conn.fetchrow(
        f"""
        INSERT INTO {CONTACTS} (
            user_id,
            first_name,
            last_name,
            gender,
            birth_date,
            birth_date_year_known,
            death_date,
            notes,
            status,
            is_self
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING {_COLUMNS}
        """,
        user_id,
        first_name,
        last_name,
        gender,
        birth_date,
        birth_date_year_known,
        death_date,
        notes,
        status,
        is_self,
    )


async def update_contact(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    contact_id: int,
    first_name: str | None,
    last_name: str | None,
    gender: str | None,
    birth_date: date | None,
    birth_date_year_known: bool,
    death_date: date | None,
    notes: str,
    status: str,
) -> asyncpg.Record | None:
    """Update mutable contact fields for one user-owned contact."""
    return await conn.fetchrow(
        f"""
        UPDATE {CONTACTS}
        SET
            first_name = $3,
            last_name = $4,
            gender = $5,
            birth_date = $6,
            birth_date_year_known = $7,
            death_date = $8,
            notes = $9,
            status = $10,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING {_COLUMNS}
        """,
        contact_id,
        user_id,
        first_name,
        last_name,
        gender,
        birth_date,
        birth_date_year_known,
        death_date,
        notes,
        status,
    )


async def delete_contact(
    conn: asyncpg.Connection,
    user_id: int,
    contact_id: int,
) -> bool:
    """Delete one user-owned contact row."""
    result = await conn.execute(
        f"DELETE FROM {CONTACTS} WHERE id = $1 AND user_id = $2",
        contact_id,
        user_id,
    )
    return result.endswith("1")


async def set_user_contact_id(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    contact_id: int,
) -> None:
    """Link a user account to their profile contact."""
    await conn.execute(
        f"""
        UPDATE {USERS}
        SET contact_id = $2, updated_at = NOW()
        WHERE id = $1
        """,
        user_id,
        contact_id,
    )
