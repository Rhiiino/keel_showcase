# stack_sandbox/backend/src/modules/home/service.py
"""Business logic for home screen content."""

from __future__ import annotations

import asyncpg

from core.database import get_pool
from modules.home import repository
from modules.home.schemas import QuotePublic



# ----- Helpers
def _row_to_quote_public(row: asyncpg.Record) -> QuotePublic:
    return QuotePublic(
        id=row["id"],
        text=row["text"],
        author=row["author"],
    )



# ----- Quotes
async def list_quotes() -> list[QuotePublic]:
    """Return all inspirational quotes for the home screen rotator."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_quotes(conn)
    return [_row_to_quote_public(row) for row in rows]
