# keel_api/src/modules/finance/proposal_repository.py

"""PostgreSQL access for finance listing proposals (confirm-before-create)."""

from __future__ import annotations

import json
from typing import Any

import asyncpg

from core.tables import FINANCE_LISTING_PROPOSALS

_PROPOSAL_COLUMNS = (
    "id, user_id, conversation_id, status, payload, "
    "created_transaction_id, created_vendor_id, created_at, updated_at"
)



# ----- Listing proposals
async def insert_proposal(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    conversation_id: int | None,
    payload: dict[str, Any],
) -> asyncpg.Record:
    """Insert a new listing proposal row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {FINANCE_LISTING_PROPOSALS} (
            user_id, conversation_id, status, payload
        )
        VALUES ($1, $2, 'pending', $3::jsonb)
        RETURNING {_PROPOSAL_COLUMNS}
        """,
        user_id,
        conversation_id,
        json.dumps(payload),
    )
    if row is None:
        raise RuntimeError("Failed to insert finance listing proposal.")
    return row


async def get_proposal(
    conn: asyncpg.Connection,
    *,
    proposal_id: int,
    user_id: int,
) -> asyncpg.Record | None:
    """Fetch one listing proposal row owned by a user."""
    return await conn.fetchrow(
        f"""
        SELECT {_PROPOSAL_COLUMNS}
        FROM {FINANCE_LISTING_PROPOSALS}
        WHERE id = $1 AND user_id = $2
        """,
        proposal_id,
        user_id,
    )


async def update_proposal_status(
    conn: asyncpg.Connection,
    *,
    proposal_id: int,
    user_id: int,
    status: str,
    created_transaction_id: int | None = None,
    created_vendor_id: int | None = None,
) -> asyncpg.Record | None:
    """Update the status on a listing proposal row."""
    return await conn.fetchrow(
        f"""
        UPDATE {FINANCE_LISTING_PROPOSALS}
        SET
            status = $3,
            created_transaction_id = COALESCE($4, created_transaction_id),
            created_vendor_id = COALESCE($5, created_vendor_id),
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING {_PROPOSAL_COLUMNS}
        """,
        proposal_id,
        user_id,
        status,
        created_transaction_id,
        created_vendor_id,
    )
