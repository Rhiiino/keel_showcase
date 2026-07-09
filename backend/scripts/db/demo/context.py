# keel_showcase/backend/scripts/db/demo/context.py
"""Shared types and helpers for showcase demo seeding."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from typing import Any

import asyncpg

from core import tables


TRUE_VALUES = {"1", "true", "t", "yes", "y", "on"}
FALSE_VALUES = {"", "0", "false", "f", "no", "n", "off"}
DEFAULT_WAIT_SECONDS = 30
DEFAULT_RETRY_INTERVAL_SECONDS = 2


class DemoSeedError(Exception):
    """Fatal demo seed error with a user-facing message."""


@dataclass
class SeedStats:
    inserted: dict[str, int] = field(default_factory=dict)
    reused: dict[str, int] = field(default_factory=dict)

    def inserted_one(self, key: str) -> None:
        self.inserted[key] = self.inserted.get(key, 0) + 1

    def reused_one(self, key: str) -> None:
        self.reused[key] = self.reused.get(key, 0) + 1

    def summary(self) -> str:
        keys = sorted(set(self.inserted) | set(self.reused))
        if not keys:
            return "No demo rows were created or reused."
        return "\n".join(
            f"- {key}: inserted {self.inserted.get(key, 0)}, reused {self.reused.get(key, 0)}"
            for key in keys
        )


@dataclass
class DemoContext:
    user_id: int
    stats: SeedStats
    today: date = field(default_factory=date.today)
    projects: dict[str, int] = field(default_factory=dict)
    vendors: dict[str, int] = field(default_factory=dict)
    payment_methods: dict[str, int] = field(default_factory=dict)
    obligations: dict[str, int] = field(default_factory=dict)
    finance_transactions: dict[str, int] = field(default_factory=dict)
    contacts: dict[str, int] = field(default_factory=dict)
    figures: dict[str, int] = field(default_factory=dict)
    focus_nodes: dict[str, int] = field(default_factory=dict)
    timeline_events: dict[str, int] = field(default_factory=dict)
    coak_records: dict[str, int] = field(default_factory=dict)
    coak_items: dict[str, int] = field(default_factory=dict)


async def resolve_user_id(
    conn: asyncpg.Connection,
    email: str,
    *,
    wait_seconds: int,
    retry_interval_seconds: int,
) -> int:
    deadline = datetime.now(timezone.utc) + timedelta(seconds=max(wait_seconds, 0))
    while True:
        user_id = await conn.fetchval(
            f"""
            SELECT id
            FROM {tables.USERS}
            WHERE lower(email) = lower($1)
            ORDER BY id
            LIMIT 1
            """,
            email,
        )
        if user_id is not None:
            return int(user_id)
        if datetime.now(timezone.utc) >= deadline:
            raise DemoSeedError(
                f"No user exists for DEMO_USER_EMAIL={email!r}. "
                "Ensure the showcase user is seeded before running demo data.",
            )
        import asyncio

        await asyncio.sleep(max(retry_interval_seconds, 1))


async def fetch_or_insert(
    conn: asyncpg.Connection,
    ctx: DemoContext,
    *,
    table_key: str,
    select_sql: str,
    select_args: tuple[Any, ...],
    insert_sql: str,
    insert_args: tuple[Any, ...],
) -> int:
    existing = await conn.fetchval(select_sql, *select_args)
    if existing is not None:
        ctx.stats.reused_one(table_key)
        return int(existing)
    row_id = await conn.fetchval(insert_sql, *insert_args)
    ctx.stats.inserted_one(table_key)
    return int(row_id)


async def upsert_tag(
    conn: asyncpg.Connection,
    ctx: DemoContext,
    *,
    table: str,
    user_id: int,
    name: str,
    color: str,
    description: str | None = None,
) -> int:
    if description is None:
        row = await conn.fetchrow(
            f"""
            INSERT INTO {table} (user_id, name, color_hex)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, name) DO UPDATE
            SET color_hex = EXCLUDED.color_hex
            RETURNING id, (xmax = 0) AS inserted
            """,
            user_id,
            name,
            color,
        )
    else:
        row = await conn.fetchrow(
            f"""
            INSERT INTO {table} (user_id, name, color_hex, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, name) DO UPDATE
            SET color_hex = EXCLUDED.color_hex,
                description = EXCLUDED.description
            RETURNING id, (xmax = 0) AS inserted
            """,
            user_id,
            name,
            color,
            description,
        )
    if row["inserted"]:
        ctx.stats.inserted_one(table)
    else:
        ctx.stats.reused_one(table)
    return int(row["id"])


def demo_note(key: str) -> str:
    return f"Demo contact: {key}"


def date_at_midnight(value: date) -> datetime:
    return datetime(value.year, value.month, value.day, tzinfo=timezone.utc)
