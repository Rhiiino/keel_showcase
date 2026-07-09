# stack_sandbox/backend/src/core/database.py
"""asyncpg connection pool — created on app startup, closed on shutdown."""

from __future__ import annotations

import asyncpg

from core.config import get_settings

_pool: asyncpg.Pool | None = None


async def init_pool() -> asyncpg.Pool:
    """Create the global pool from ``DATABASE_URL``."""
    global _pool
    if _pool is not None:
        return _pool

    settings = get_settings()
    _pool = await asyncpg.create_pool(
        dsn=settings.database_url,
        min_size=1,
        max_size=10,
    )
    return _pool


async def close_pool() -> None:
    """Close the global pool if it was opened."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    """Return the active pool (raises if ``init_pool`` has not run)."""
    if _pool is None:
        raise RuntimeError("Database pool is not initialized. Was the app lifespan started?")
    return _pool
