# keel_api/src/modules/figures/repository.py

"""SQL access for figures."""

from __future__ import annotations

from datetime import date

import asyncpg

from core.tables import FIGURES

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
    created_at,
    updated_at
"""



# ----- Figures table operations
async def list_figures(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List figures for one user ordered by last name, first name, id."""
    return await conn.fetch(
        f"""
        SELECT {_COLUMNS}
        FROM {FIGURES}
        WHERE user_id = $1
        ORDER BY
            NULLIF(trim(last_name), '') NULLS LAST,
            NULLIF(trim(first_name), '') NULLS LAST,
            id ASC
        """,
        user_id,
    )


async def get_figure_by_id(
    conn: asyncpg.Connection,
    user_id: int,
    figure_id: int,
) -> asyncpg.Record | None:
    """Fetch one figure owned by the user."""
    return await conn.fetchrow(
        f"""
        SELECT {_COLUMNS}
        FROM {FIGURES}
        WHERE id = $1 AND user_id = $2
        """,
        figure_id,
        user_id,
    )


async def insert_figure(
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
) -> asyncpg.Record:
    """Insert a new figure row for one user."""
    return await conn.fetchrow(
        f"""
        INSERT INTO {FIGURES} (
            user_id,
            first_name,
            last_name,
            gender,
            birth_date,
            birth_date_year_known,
            death_date,
            notes,
            status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
    )


async def update_figure(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    figure_id: int,
    first_name: str | None,
    last_name: str | None,
    gender: str | None,
    birth_date: date | None,
    birth_date_year_known: bool,
    death_date: date | None,
    notes: str,
    status: str,
) -> asyncpg.Record | None:
    """Update mutable figure fields for one user-owned figure."""
    return await conn.fetchrow(
        f"""
        UPDATE {FIGURES}
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
        figure_id,
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


async def delete_figure(
    conn: asyncpg.Connection,
    user_id: int,
    figure_id: int,
) -> bool:
    """Delete one user-owned figure row."""
    result = await conn.execute(
        f"DELETE FROM {FIGURES} WHERE id = $1 AND user_id = $2",
        figure_id,
        user_id,
    )
    return result.endswith("1")
