# stack_sandbox/backend/src/modules/home/repository.py
"""SQL access for home screen global content."""

from __future__ import annotations

import asyncpg

from core.tables import QUOTES

_COLUMNS = "id, text, author"



# ----- Quotes table operations
async def list_quotes(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    """List all inspirational quotes in stable display order."""
    return await conn.fetch(
        f"""
        SELECT {_COLUMNS}
        FROM {QUOTES}
        ORDER BY id ASC
        """,
    )
