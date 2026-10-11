# keel_showcase/backend/scripts/db/demo/seeds/figures.py

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Any

import asyncpg

from core import tables

from context import DemoContext, fetch_or_insert


@dataclass(frozen=True)
class FigureSpec:
    key: str
    first_name: str
    last_name: str | None
    gender: str
    birth_date: date | None
    death_date: date | None
    birth_date_year_known: bool = True
    notes: str | None = None


async def seed_figures(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    # BC dates are valid in Postgres but not in Python/asyncpg (date_decode
    # raises "ordinal must be >= 1"). Keep ancient figures date-less and note
    # approximate years in notes instead.
    specs = (
        FigureSpec("ada", "Ada", "Lovelace", "female", date(1815, 12, 10), date(1852, 11, 27)),
        FigureSpec("turing", "Alan", "Turing", "male", date(1912, 6, 23), date(1954, 6, 7)),
        FigureSpec("hopper", "Grace", "Hopper", "female", date(1906, 12, 9), date(1992, 1, 1)),
        FigureSpec("feynman", "Richard", "Feynman", "male", date(1918, 5, 11), date(1988, 2, 15)),
        FigureSpec("einstein", "Albert", "Einstein", "male", date(1879, 3, 14), date(1955, 4, 18)),
        FigureSpec("karpathy", "Andrej", "Karpathy", "male", date(1986, 10, 23), None),
        FigureSpec("lecun", "Yann", "LeCun", "male", date(1960, 7, 8), None),
        FigureSpec("trump", "Donald", "Trump", "male", date(1946, 6, 14), None),
        FigureSpec(
            "socrates",
            "Socrates",
            None,
            "male",
            None,
            None,
            notes="Demo figure: socrates (c. 470–399 BC)",
        ),
    )
    for spec in specs:
        notes = spec.notes or f"Demo figure: {spec.key}"
        figure_id = await fetch_or_insert(
            conn,
            ctx,
            table_key=tables.FIGURES,
            select_sql=f"""
                SELECT id FROM {tables.FIGURES}
                WHERE user_id = $1
                  AND (
                    notes = $2
                    OR (first_name = $3 AND notes LIKE 'Demo figure: ' || $4 || '%')
                  )
                ORDER BY id LIMIT 1
            """,
            select_args=(ctx.user_id, notes, spec.first_name, spec.key),
            insert_sql=f"""
                INSERT INTO {tables.FIGURES}
                    (
                        user_id, first_name, last_name, gender,
                        birth_date, birth_date_year_known, death_date, notes
                    )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            """,
            insert_args=_figure_insert_args(ctx.user_id, spec, notes),
        )
        ctx.figures[spec.key] = figure_id


def _figure_insert_args(user_id: int, spec: FigureSpec, notes: str) -> tuple[Any, ...]:
    return (
        user_id,
        spec.first_name,
        spec.last_name,
        spec.gender,
        spec.birth_date,
        spec.birth_date_year_known,
        spec.death_date,
        notes,
    )
