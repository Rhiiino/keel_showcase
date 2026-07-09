# keel_api/src/modules/finance/vendor_repository.py

"""SQL access for finance vendors."""

from __future__ import annotations

import asyncpg

from core.tables import FINANCE_VENDORS

_VENDOR_COLUMNS = (
    "id, user_id, name, website_url, billing_portal_url, notes, default_currency, "
    "created_at, updated_at"
)

_VENDOR_RETURNING = (
    "id, user_id, name, website_url, billing_portal_url, notes, default_currency, "
    "created_at, updated_at"
)



# ----- Vendors table operations
async def list_vendors(
    conn: asyncpg.Connection,
    user_id: int,
    *,
    query: str | None = None,
) -> list[asyncpg.Record]:
    """List vendor rows for a user with optional search."""
    if query and query.strip():
        pattern = f"%{query.strip()}%"
        return await conn.fetch(
            f"""
            SELECT {_VENDOR_COLUMNS}
            FROM {FINANCE_VENDORS}
            WHERE user_id = $1
              AND name ILIKE $2
            ORDER BY name ASC, id ASC
            """,
            user_id,
            pattern,
        )
    return await conn.fetch(
        f"""
        SELECT {_VENDOR_COLUMNS}
        FROM {FINANCE_VENDORS}
        WHERE user_id = $1
        ORDER BY name ASC, id ASC
        """,
        user_id,
    )


async def get_vendor(
    conn: asyncpg.Connection,
    vendor_id: int,
) -> asyncpg.Record | None:
    """Fetch one vendor row by id."""
    return await conn.fetchrow(
        f"""
        SELECT {_VENDOR_COLUMNS}
        FROM {FINANCE_VENDORS}
        WHERE id = $1
        """,
        vendor_id,
    )


async def insert_vendor(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    name: str,
    website_url: str | None,
    billing_portal_url: str | None,
    notes: str,
    default_currency: str | None,
) -> asyncpg.Record:
    """Insert a new vendor row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {FINANCE_VENDORS} (
            user_id, name, website_url, billing_portal_url, notes, default_currency
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING {_VENDOR_RETURNING}
        """,
        user_id,
        name,
        website_url,
        billing_portal_url,
        notes,
        default_currency,
    )
    if row is None:
        raise RuntimeError("Failed to insert finance vendor.")
    return row


async def update_vendor(
    conn: asyncpg.Connection,
    *,
    vendor_id: int,
    name: str,
    website_url: str | None,
    billing_portal_url: str | None,
    notes: str,
    default_currency: str | None,
) -> asyncpg.Record | None:
    """Update vendor metadata columns."""
    return await conn.fetchrow(
        f"""
        UPDATE {FINANCE_VENDORS}
        SET
            name = $2,
            website_url = $3,
            billing_portal_url = $4,
            notes = $5,
            default_currency = $6,
            updated_at = NOW()
        WHERE id = $1
        RETURNING {_VENDOR_RETURNING}
        """,
        vendor_id,
        name,
        website_url,
        billing_portal_url,
        notes,
        default_currency,
    )


async def delete_vendor(
    conn: asyncpg.Connection,
    *,
    vendor_id: int,
) -> asyncpg.Record | None:
    """Delete one vendor row."""
    return await conn.fetchrow(
        f"""
        DELETE FROM {FINANCE_VENDORS}
        WHERE id = $1
        RETURNING id
        """,
        vendor_id,
    )


async def find_by_name(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    name: str,
) -> asyncpg.Record | None:
    """Find a vendor row by exact name for a user."""
    return await conn.fetchrow(
        f"""
        SELECT {_VENDOR_RETURNING}
        FROM {FINANCE_VENDORS}
        WHERE user_id = $1 AND name = $2
        """,
        user_id,
        name,
    )


async def find_or_create_by_name(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    name: str,
) -> asyncpg.Record:
    """Find an existing vendor by name or insert a new one."""
    existing = await conn.fetchrow(
        f"""
        SELECT {_VENDOR_COLUMNS}
        FROM {FINANCE_VENDORS}
        WHERE user_id = $1 AND name = $2
        """,
        user_id,
        name,
    )
    if existing is not None:
        return existing
    return await insert_vendor(
        conn,
        user_id=user_id,
        name=name,
        website_url=None,
        billing_portal_url=None,
        notes="",
        default_currency=None,
    )
