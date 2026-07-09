# keel_api/src/modules/finance/transaction_repository.py

"""SQL access for finance transactions."""

from __future__ import annotations

import asyncpg

from core.tables import FINANCE_OBLIGATIONS, FINANCE_TRANSACTIONS, FINANCE_VENDORS

_TRANSACTION_COLUMNS = (
    "t.id, t.user_id, t.vendor_id, t.obligation_id, t.title, t.kind, t.status, t.sort_order, "
    "t.listing_url, t.notes, t.price_amount, t.currency, t.quantity, t.ordered_at, t.received_at, "
    "t.created_at, t.updated_at, v.name AS vendor_name, o.name AS obligation_name"
)

_TRANSACTION_RETURNING = (
    "id, user_id, vendor_id, obligation_id, title, kind, status, sort_order, listing_url, notes, "
    "price_amount, currency, quantity, ordered_at, received_at, created_at, updated_at"
)

_TRANSACTION_FROM = f"""
    FROM {FINANCE_TRANSACTIONS} t
    LEFT JOIN {FINANCE_VENDORS} v ON v.id = t.vendor_id
    LEFT JOIN {FINANCE_OBLIGATIONS} o ON o.id = t.obligation_id
"""



# ----- Transactions table operations
async def list_transactions(
    conn: asyncpg.Connection,
    user_id: int,
    *,
    status: str | None = None,
    kind: str | None = None,
    vendor_id: int | None = None,
    query: str | None = None,
) -> list[asyncpg.Record]:
    """List transaction rows for a user with optional filters."""
    conditions = ["t.user_id = $1"]
    params: list[object] = [user_id]
    param_index = 2

    if status:
        conditions.append(f"t.status = ${param_index}")
        params.append(status)
        param_index += 1

    if kind:
        conditions.append(f"t.kind = ${param_index}")
        params.append(kind)
        param_index += 1

    if vendor_id is not None:
        conditions.append(f"t.vendor_id = ${param_index}")
        params.append(vendor_id)
        param_index += 1

    if query and query.strip():
        pattern = f"%{query.strip()}%"
        conditions.append(
            f"(t.title ILIKE ${param_index} OR t.notes ILIKE ${param_index} "
            f"OR v.name ILIKE ${param_index})"
        )
        params.append(pattern)
        param_index += 1

    where_clause = " AND ".join(conditions)
    return await conn.fetch(
        f"""
        SELECT {_TRANSACTION_COLUMNS}
        {_TRANSACTION_FROM}
        WHERE {where_clause}
        ORDER BY
            CASE t.status
                WHEN 'considering' THEN 0
                WHEN 'ordered' THEN 1
                WHEN 'in_transit' THEN 2
                WHEN 'received' THEN 3
                WHEN 'cancelled' THEN 4
                WHEN 'returned' THEN 5
                ELSE 99
            END,
            t.sort_order ASC,
            t.id ASC
        """,
        *params,
    )


async def get_transaction(
    conn: asyncpg.Connection,
    transaction_id: int,
) -> asyncpg.Record | None:
    """Fetch one transaction row by id."""
    return await conn.fetchrow(
        f"""
        SELECT {_TRANSACTION_COLUMNS}
        {_TRANSACTION_FROM}
        WHERE t.id = $1
        """,
        transaction_id,
    )


async def next_transaction_sort_order(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    status: str,
) -> int:
    """Return the next sort_order for a new transaction in a status group."""
    value = await conn.fetchval(
        f"""
        SELECT COALESCE(MAX(sort_order), -1) + 1
        FROM {FINANCE_TRANSACTIONS}
        WHERE user_id = $1 AND status = $2
        """,
        user_id,
        status,
    )
    return int(value or 0)


async def insert_transaction(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    vendor_id: int | None,
    obligation_id: int | None,
    title: str,
    kind: str,
    status: str,
    sort_order: int,
    listing_url: str | None,
    notes: str,
    price_amount: object | None,
    currency: str,
    quantity: int,
    ordered_at: object | None,
    received_at: object | None,
) -> asyncpg.Record:
    """Insert a new transaction row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {FINANCE_TRANSACTIONS} (
            user_id,
            vendor_id,
            obligation_id,
            title,
            kind,
            status,
            sort_order,
            listing_url,
            notes,
            price_amount,
            currency,
            quantity,
            ordered_at,
            received_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING {_TRANSACTION_RETURNING}
        """,
        user_id,
        vendor_id,
        obligation_id,
        title,
        kind,
        status,
        sort_order,
        listing_url,
        notes,
        price_amount,
        currency,
        quantity,
        ordered_at,
        received_at,
    )
    if row is None:
        raise RuntimeError("Failed to insert finance transaction.")
    return row


async def update_transaction(
    conn: asyncpg.Connection,
    *,
    transaction_id: int,
    vendor_id: int | None,
    obligation_id: int | None,
    title: str,
    kind: str,
    status: str,
    sort_order: int,
    listing_url: str | None,
    notes: str,
    price_amount: object | None,
    currency: str,
    quantity: int,
    ordered_at: object | None,
    received_at: object | None,
) -> asyncpg.Record | None:
    """Update transaction metadata columns."""
    return await conn.fetchrow(
        f"""
        UPDATE {FINANCE_TRANSACTIONS}
        SET
            vendor_id = $2,
            obligation_id = $3,
            title = $4,
            kind = $5,
            status = $6,
            sort_order = $7,
            listing_url = $8,
            notes = $9,
            price_amount = $10,
            currency = $11,
            quantity = $12,
            ordered_at = $13,
            received_at = $14,
            updated_at = NOW()
        WHERE id = $1
        RETURNING {_TRANSACTION_RETURNING}
        """,
        transaction_id,
        vendor_id,
        obligation_id,
        title,
        kind,
        status,
        sort_order,
        listing_url,
        notes,
        price_amount,
        currency,
        quantity,
        ordered_at,
        received_at,
    )


async def reorder_transactions(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    entries: list[tuple[int, str, int]],
) -> None:
    """Persist status and sort_order for a batch of owned transactions."""
    async with conn.transaction():
        for transaction_id, status, sort_order in entries:
            await conn.execute(
                f"""
                UPDATE {FINANCE_TRANSACTIONS}
                SET status = $3, sort_order = $4, updated_at = NOW()
                WHERE id = $1 AND user_id = $2
                """,
                transaction_id,
                user_id,
                status,
                sort_order,
            )


async def delete_transaction(
    conn: asyncpg.Connection,
    *,
    transaction_id: int,
) -> bool:
    """Delete one transaction row."""
    result = await conn.execute(
        f"DELETE FROM {FINANCE_TRANSACTIONS} WHERE id = $1",
        transaction_id,
    )
    return result.endswith("1")
