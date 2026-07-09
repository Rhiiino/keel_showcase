# keel_showcase/backend/scripts/db/demo/seeds/figures.py

from __future__ import annotations

from datetime import date

import asyncpg

from core import tables

from context import DemoContext, fetch_or_insert


async def seed_figures(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    specs = (
        ("ada", "Ada", "Lovelace", "female", date(1815, 12, 10), date(1852, 11, 27)),
        ("turing", "Alan", "Turing", "male", date(1912, 6, 23), date(1954, 6, 7)),
        ("hopper", "Grace", "Hopper", "female", date(1906, 12, 9), date(1992, 1, 1)),
    )
    for key, first_name, last_name, gender, birth_date, death_date in specs:
        notes = f"Demo figure: {key}"
        figure_id = await fetch_or_insert(
            conn,
            ctx,
            table_key=tables.FIGURES,
            select_sql=f"""
                SELECT id FROM {tables.FIGURES}
                WHERE user_id = $1 AND notes = $2
                ORDER BY id LIMIT 1
            """,
            select_args=(ctx.user_id, notes),
            insert_sql=f"""
                INSERT INTO {tables.FIGURES}
                    (user_id, first_name, last_name, gender, birth_date, death_date, notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            """,
            insert_args=(ctx.user_id, first_name, last_name, gender, birth_date, death_date, notes),
        )
        ctx.figures[key] = figure_id
