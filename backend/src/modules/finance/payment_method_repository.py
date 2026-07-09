# keel_api/src/modules/finance/payment_method_repository.py

"""SQL access for finance payment methods."""

from __future__ import annotations

import asyncpg

from core.tables import FINANCE_PAYMENT_METHODS

_PAYMENT_METHOD_COLUMNS = (
    "id, user_id, kind, label, institution_name, last_four, notes, "
    "is_active, sort_order, created_at, updated_at"
)

_PAYMENT_METHOD_RETURNING = (
    "id, user_id, kind, label, institution_name, last_four, notes, "
    "is_active, sort_order, created_at, updated_at"
)



# ----- Payment methods table operations
async def list_payment_methods(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List payment method rows for a user."""
    return await conn.fetch(
        f"""
        SELECT {_PAYMENT_METHOD_COLUMNS}
        FROM {FINANCE_PAYMENT_METHODS}
        WHERE user_id = $1
        ORDER BY sort_order ASC, id ASC
        """,
        user_id,
    )


async def get_payment_method(
    conn: asyncpg.Connection,
    payment_method_id: int,
) -> asyncpg.Record | None:
    """Fetch one payment method row by id."""
    return await conn.fetchrow(
        f"""
        SELECT {_PAYMENT_METHOD_COLUMNS}
        FROM {FINANCE_PAYMENT_METHODS}
        WHERE id = $1
        """,
        payment_method_id,
    )


async def next_payment_method_sort_order(
    conn: asyncpg.Connection,
    *,
    user_id: int,
) -> int:
    """Return the next sort_order for a new payment method."""
    value = await conn.fetchval(
        f"""
        SELECT COALESCE(MAX(sort_order), -1) + 1
        FROM {FINANCE_PAYMENT_METHODS}
        WHERE user_id = $1
        """,
        user_id,
    )
    return int(value or 0)


async def insert_payment_method(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    kind: str,
    label: str,
    institution_name: str | None,
    last_four: str | None,
    notes: str,
    is_active: bool,
    sort_order: int,
) -> asyncpg.Record:
    """Insert a new payment method row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {FINANCE_PAYMENT_METHODS} (
            user_id, kind, label, institution_name, last_four, notes, is_active, sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING {_PAYMENT_METHOD_RETURNING}
        """,
        user_id,
        kind,
        label,
        institution_name,
        last_four,
        notes,
        is_active,
        sort_order,
    )
    if row is None:
        raise RuntimeError("Failed to insert finance payment method.")
    return row


async def update_payment_method(
    conn: asyncpg.Connection,
    *,
    payment_method_id: int,
    kind: str,
    label: str,
    institution_name: str | None,
    last_four: str | None,
    notes: str,
    is_active: bool,
    sort_order: int,
) -> asyncpg.Record | None:
    """Update payment method metadata columns."""
    return await conn.fetchrow(
        f"""
        UPDATE {FINANCE_PAYMENT_METHODS}
        SET
            kind = $2,
            label = $3,
            institution_name = $4,
            last_four = $5,
            notes = $6,
            is_active = $7,
            sort_order = $8,
            updated_at = NOW()
        WHERE id = $1
        RETURNING {_PAYMENT_METHOD_RETURNING}
        """,
        payment_method_id,
        kind,
        label,
        institution_name,
        last_four,
        notes,
        is_active,
        sort_order,
    )


async def reorder_payment_methods(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    entries: list[tuple[int, int]],
) -> None:
    """Persist sort_order for a batch of owned payment methods."""
    async with conn.transaction():
        for payment_method_id, sort_order in entries:
            await conn.execute(
                f"""
                UPDATE {FINANCE_PAYMENT_METHODS}
                SET sort_order = $3, updated_at = NOW()
                WHERE id = $1 AND user_id = $2
                """,
                payment_method_id,
                user_id,
                sort_order,
            )


async def delete_payment_method(
    conn: asyncpg.Connection,
    *,
    payment_method_id: int,
) -> asyncpg.Record | None:
    """Delete one payment method row."""
    return await conn.fetchrow(
        f"""
        DELETE FROM {FINANCE_PAYMENT_METHODS}
        WHERE id = $1
        RETURNING id
        """,
        payment_method_id,
    )
