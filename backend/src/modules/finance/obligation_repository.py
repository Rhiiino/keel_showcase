# keel_api/src/modules/finance/obligation_repository.py

"""SQL access for finance obligations."""

from __future__ import annotations

import asyncpg

from core.tables import (
    FINANCE_OBLIGATION_TAG_ASSIGNMENTS,
    FINANCE_OBLIGATIONS,
    FINANCE_PAYMENT_METHODS,
    FINANCE_VENDORS,
)

_OBLIGATION_COLUMNS = (
    "o.id, o.user_id, o.vendor_id, o.payment_method_id, o.name, o.kind, o.status, "
    "o.amount, o.currency, o.billing_interval, o.billing_day, o.started_at, "
    "o.next_billing_at, o.cancelled_at, o.ends_at, o.account_url, o.notes, o.sort_order, "
    "o.created_at, o.updated_at, v.name AS vendor_name, pm.label AS payment_method_label"
)

_OBLIGATION_RETURNING = (
    "id, user_id, vendor_id, payment_method_id, name, kind, status, amount, currency, "
    "billing_interval, billing_day, started_at, next_billing_at, cancelled_at, ends_at, "
    "account_url, notes, sort_order, created_at, updated_at"
)

_OBLIGATION_FROM = f"""
    FROM {FINANCE_OBLIGATIONS} o
    LEFT JOIN {FINANCE_VENDORS} v ON v.id = o.vendor_id
    LEFT JOIN {FINANCE_PAYMENT_METHODS} pm ON pm.id = o.payment_method_id
"""



# ----- Obligations table operations
async def list_obligations(
    conn: asyncpg.Connection,
    user_id: int,
    *,
    status: str | None = None,
    kind: str | None = None,
    vendor_id: int | None = None,
    payment_method_id: int | None = None,
    tag_ids: list[int] | None = None,
    next_billing_before: object | None = None,
    query: str | None = None,
) -> list[asyncpg.Record]:
    """List obligation rows for a user with optional filters."""
    conditions = ["o.user_id = $1"]
    params: list[object] = [user_id]
    param_index = 2

    if status:
        conditions.append(f"o.status = ${param_index}")
        params.append(status)
        param_index += 1

    if kind:
        conditions.append(f"o.kind = ${param_index}")
        params.append(kind)
        param_index += 1

    if vendor_id is not None:
        conditions.append(f"o.vendor_id = ${param_index}")
        params.append(vendor_id)
        param_index += 1

    if payment_method_id is not None:
        conditions.append(f"o.payment_method_id = ${param_index}")
        params.append(payment_method_id)
        param_index += 1

    if next_billing_before is not None:
        conditions.append(f"o.next_billing_at IS NOT NULL AND o.next_billing_at <= ${param_index}")
        params.append(next_billing_before)
        param_index += 1

    if tag_ids:
        conditions.append(
            f"""
            EXISTS (
                SELECT 1
                FROM {FINANCE_OBLIGATION_TAG_ASSIGNMENTS} ota
                WHERE ota.obligation_id = o.id
                  AND ota.tag_id = ANY(${param_index}::int[])
            )
            """
        )
        params.append(tag_ids)
        param_index += 1

    if query and query.strip():
        pattern = f"%{query.strip()}%"
        conditions.append(
            f"(o.name ILIKE ${param_index} OR o.notes ILIKE ${param_index} "
            f"OR v.name ILIKE ${param_index})"
        )
        params.append(pattern)
        param_index += 1

    where_clause = " AND ".join(conditions)
    return await conn.fetch(
        f"""
        SELECT {_OBLIGATION_COLUMNS}
        {_OBLIGATION_FROM}
        WHERE {where_clause}
        ORDER BY o.sort_order ASC, o.id ASC
        """,
        *params,
    )


async def get_obligation(
    conn: asyncpg.Connection,
    obligation_id: int,
) -> asyncpg.Record | None:
    """Fetch one obligation row by id."""
    return await conn.fetchrow(
        f"""
        SELECT {_OBLIGATION_COLUMNS}
        {_OBLIGATION_FROM}
        WHERE o.id = $1
        """,
        obligation_id,
    )


async def next_obligation_sort_order(
    conn: asyncpg.Connection,
    *,
    user_id: int,
) -> int:
    """Return the next sort_order for a new obligation."""
    value = await conn.fetchval(
        f"""
        SELECT COALESCE(MAX(sort_order), -1) + 1
        FROM {FINANCE_OBLIGATIONS}
        WHERE user_id = $1
        """,
        user_id,
    )
    return int(value or 0)


async def insert_obligation(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    vendor_id: int | None,
    payment_method_id: int | None,
    name: str,
    kind: str,
    status: str,
    amount: object | None,
    currency: str,
    billing_interval: str,
    billing_day: int | None,
    started_at: object | None,
    next_billing_at: object | None,
    cancelled_at: object | None,
    ends_at: object | None,
    account_url: str | None,
    notes: str,
    sort_order: int,
) -> asyncpg.Record:
    """Insert a new obligation row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {FINANCE_OBLIGATIONS} (
            user_id, vendor_id, payment_method_id, name, kind, status, amount, currency,
            billing_interval, billing_day, started_at, next_billing_at, cancelled_at, ends_at,
            account_url, notes, sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING {_OBLIGATION_RETURNING}
        """,
        user_id,
        vendor_id,
        payment_method_id,
        name,
        kind,
        status,
        amount,
        currency,
        billing_interval,
        billing_day,
        started_at,
        next_billing_at,
        cancelled_at,
        ends_at,
        account_url,
        notes,
        sort_order,
    )
    if row is None:
        raise RuntimeError("Failed to insert finance obligation.")
    return row


async def update_obligation(
    conn: asyncpg.Connection,
    *,
    obligation_id: int,
    vendor_id: int | None,
    payment_method_id: int | None,
    name: str,
    kind: str,
    status: str,
    amount: object | None,
    currency: str,
    billing_interval: str,
    billing_day: int | None,
    started_at: object | None,
    next_billing_at: object | None,
    cancelled_at: object | None,
    ends_at: object | None,
    account_url: str | None,
    notes: str,
    sort_order: int,
) -> asyncpg.Record | None:
    """Update obligation metadata columns."""
    return await conn.fetchrow(
        f"""
        UPDATE {FINANCE_OBLIGATIONS}
        SET
            vendor_id = $2,
            payment_method_id = $3,
            name = $4,
            kind = $5,
            status = $6,
            amount = $7,
            currency = $8,
            billing_interval = $9,
            billing_day = $10,
            started_at = $11,
            next_billing_at = $12,
            cancelled_at = $13,
            ends_at = $14,
            account_url = $15,
            notes = $16,
            sort_order = $17,
            updated_at = NOW()
        WHERE id = $1
        RETURNING {_OBLIGATION_RETURNING}
        """,
        obligation_id,
        vendor_id,
        payment_method_id,
        name,
        kind,
        status,
        amount,
        currency,
        billing_interval,
        billing_day,
        started_at,
        next_billing_at,
        cancelled_at,
        ends_at,
        account_url,
        notes,
        sort_order,
    )


async def delete_obligation(
    conn: asyncpg.Connection,
    *,
    obligation_id: int,
) -> bool:
    """Delete one obligation row."""
    result = await conn.execute(
        f"DELETE FROM {FINANCE_OBLIGATIONS} WHERE id = $1",
        obligation_id,
    )
    return result.endswith("1")


async def fetch_summary_metrics(
    conn: asyncpg.Connection,
    user_id: int,
    *,
    renewals_before: object,
) -> asyncpg.Record:
    """Aggregate active obligation count, monthly burn, and upcoming renewals."""
    return await conn.fetchrow(
        f"""
        SELECT
            COUNT(*) FILTER (
                WHERE status IN ('active', 'trial')
            )::int AS active_obligation_count,
            COALESCE(
                SUM(
                    CASE
                        WHEN status NOT IN ('active', 'trial') OR amount IS NULL THEN 0
                        WHEN billing_interval = 'monthly' THEN amount
                        WHEN billing_interval = 'annual' THEN amount / 12
                        WHEN billing_interval = 'quarterly' THEN amount / 3
                        WHEN billing_interval = 'weekly' THEN amount * 52 / 12
                        ELSE 0
                    END
                ),
                0
            ) AS monthly_burn,
            COUNT(*) FILTER (
                WHERE next_billing_at IS NOT NULL
                  AND next_billing_at <= $2
                  AND status IN ('active', 'trial')
            )::int AS renewals_next_30_days
        FROM {FINANCE_OBLIGATIONS}
        WHERE user_id = $1
        """,
        user_id,
        renewals_before,
    )
