# keel_api/scripts/db/demo/generate_demo_data.py
"""Generate idempotent demo data for local development."""

from __future__ import annotations

import argparse
import asyncio
import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from decimal import Decimal
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
    projects: dict[str, int] = field(default_factory=dict)
    vendors: dict[str, int] = field(default_factory=dict)
    finance_transactions: dict[str, int] = field(default_factory=dict)
    contacts: dict[str, int] = field(default_factory=dict)
    focus_nodes: dict[str, int] = field(default_factory=dict)


def _parse_bool(raw: str) -> bool:
    value = raw.strip().lower()
    if value in TRUE_VALUES:
        return True
    if value in FALSE_VALUES:
        return False
    raise DemoSeedError("DEMO_SEED_ENABLED must be true/false, yes/no, on/off, or 1/0.")


def _database_url() -> str:
    value = (os.environ.get("DATABASE_URL") or "").strip()
    if not value:
        raise DemoSeedError("DATABASE_URL is not set.")
    return value


def _demo_user_email(cli_value: str | None) -> str:
    value = (cli_value or os.environ.get("DEMO_USER_EMAIL") or "").strip()
    if not value:
        raise DemoSeedError(
            "DEMO_USER_EMAIL is required when DEMO_SEED_ENABLED is true. "
            "Sign in locally, set DEMO_USER_EMAIL to that email, and rerun compose.",
        )
    return value


async def _resolve_user_id(
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
                f"No local user exists for DEMO_USER_EMAIL={email!r}. "
                "Sign in through the dev UI first, then rerun the demo seed.",
            )
        await asyncio.sleep(max(retry_interval_seconds, 1))


async def _fetch_or_insert(
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


async def _seed_user_preferences(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    result = await conn.execute(
        f"""
        INSERT INTO {tables.USER_PREFERENCES} (user_id, data)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (user_id) DO NOTHING
        """,
        ctx.user_id,
        '{"theme":"dark","nav_panel":{"is_open":true},"nav_menu_layout":[]}',
    )
    if result.endswith("1"):
        ctx.stats.inserted_one(tables.USER_PREFERENCES)
    else:
        ctx.stats.reused_one(tables.USER_PREFERENCES)


async def _seed_project_tag(conn: asyncpg.Connection, ctx: DemoContext, name: str, color: str) -> int:
    row = await conn.fetchrow(
        f"""
        INSERT INTO {tables.PROJECT_TAGS} (user_id, name, color_hex)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, name) DO UPDATE
        SET color_hex = EXCLUDED.color_hex
        RETURNING id, (xmax = 0) AS inserted
        """,
        ctx.user_id,
        name,
        color,
    )
    if row["inserted"]:
        ctx.stats.inserted_one(tables.PROJECT_TAGS)
    else:
        ctx.stats.reused_one(tables.PROJECT_TAGS)
    return int(row["id"])


async def _seed_project(
    conn: asyncpg.Connection,
    ctx: DemoContext,
    key: str,
    title: str,
    description: str,
    status: str,
    kind: str,
    color: str,
    font: str,
) -> int:
    project_id = await _fetch_or_insert(
        conn,
        ctx,
        table_key=tables.PROJECTS,
        select_sql=f"""
            SELECT id FROM {tables.PROJECTS}
            WHERE user_id = $1 AND title = $2
            ORDER BY id LIMIT 1
        """,
        select_args=(ctx.user_id, title),
        insert_sql=f"""
            INSERT INTO {tables.PROJECTS}
                (
                    user_id, title, description, status, kind,
                    cover_glow_color_hex, cover_model_color_hex,
                    kanban_card_color_hex, title_font_key
                )
            VALUES ($1, $2, $3, $4, $5, $6, $6, $6, $7)
            RETURNING id
        """,
        insert_args=(ctx.user_id, title, description, status, kind, color, font),
    )
    await conn.execute(
        f"""
        INSERT INTO {tables.PROJECT_CANVAS}
            (project_id, user_id, name, sort_order, is_default, state)
        SELECT $1, $2, 'Main', 0, true, $3::jsonb
        WHERE NOT EXISTS (
            SELECT 1 FROM {tables.PROJECT_CANVAS} WHERE project_id = $1
        )
        """,
        project_id,
        ctx.user_id,
        '{"nodes":[],"edges":[],"viewport":{"x":0,"y":0,"zoom":1}}',
    )
    ctx.projects[key] = project_id
    return project_id


async def _seed_projects(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    planning = await _seed_project_tag(conn, ctx, "Demo Planning", "#8B5CF6")
    build = await _seed_project_tag(conn, ctx, "Demo Build", "#06B6D4")
    life = await _seed_project_tag(conn, ctx, "Demo Life", "#F97316")
    specs = (
        ("launch", "Demo: Launch Dashboard", "Sample active product project.", "active", "software", "#8B5CF6", "tech", (planning, build)),
        ("studio", "Demo: Home Studio Refresh", "Sample personal planning project.", "planning", "personal", "#06B6D4", "rounded", (planning, life)),
        ("archive", "Demo: Archived Website Cleanup", "Completed sample project for archive UI checks.", "archived", "software", "#64748B", "mono", (build,)),
    )
    for key, title, description, status, kind, color, font, tags_for_project in specs:
        project_id = await _seed_project(conn, ctx, key, title, description, status, kind, color, font)
        for tag_id in tags_for_project:
            await conn.execute(
                f"""
                INSERT INTO {tables.PROJECT_TAG_ASSIGNMENTS} (project_id, tag_id)
                VALUES ($1, $2)
                ON CONFLICT (project_id, tag_id) DO NOTHING
                """,
                project_id,
                tag_id,
            )


async def _seed_finance(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    for key, name, url in (
        ("studio", "Demo Audio Supply", "https://example.com/audio"),
        ("desk", "Demo Desk Goods", "https://example.com/desk"),
    ):
        row = await conn.fetchrow(
            f"""
            INSERT INTO {tables.FINANCE_VENDORS}
                (user_id, name, website_url, notes, default_currency)
            VALUES ($1, $2, $3, 'Demo vendor generated for local development.', 'USD')
            ON CONFLICT (user_id, name) DO UPDATE
            SET website_url = EXCLUDED.website_url,
                notes = EXCLUDED.notes,
                updated_at = NOW()
            RETURNING id, (xmax = 0) AS inserted
            """,
            ctx.user_id,
            name,
            url,
        )
        if row["inserted"]:
            ctx.stats.inserted_one(tables.FINANCE_VENDORS)
        else:
            ctx.stats.reused_one(tables.FINANCE_VENDORS)
        ctx.vendors[key] = int(row["id"])

    specs = (
        ("mic", "Demo: USB Microphone", "studio", "considering", 0, Decimal("89.00")),
        ("lamp", "Demo: Desk Lamp", "desk", "ordered", 1, Decimal("42.50")),
        ("chair", "Demo: Reading Chair", "desk", "received", 2, Decimal("240.00")),
    )
    for key, title, vendor_key, status, sort_order, price in specs:
        item_id = await _fetch_or_insert(
            conn,
            ctx,
            table_key=tables.FINANCE_TRANSACTIONS,
            select_sql=f"""
                SELECT id FROM {tables.FINANCE_TRANSACTIONS}
                WHERE user_id = $1 AND title = $2
                ORDER BY id LIMIT 1
            """,
            select_args=(ctx.user_id, title),
            insert_sql=f"""
                INSERT INTO {tables.FINANCE_TRANSACTIONS}
                    (
                        user_id, vendor_id, title, kind, status, sort_order,
                        listing_url, notes, price_amount, currency
                    )
                VALUES ($1, $2, $3, 'physical', $4, $5, $6, $7, $8, 'USD')
                RETURNING id
            """,
            insert_args=(
                ctx.user_id,
                ctx.vendors[vendor_key],
                title,
                status,
                sort_order,
                f"https://example.com/demo/{key}",
                "Demo purchase generated for local development.",
                price,
            ),
        )
        ctx.finance_transactions[key] = item_id


async def _seed_contacts(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    specs = (
        ("alex", "Alex", "Rivera", "male", "Demo self-style contact."),
        ("morgan", "Morgan", "Rivera", "female", "Demo spouse contact."),
        ("jamie", "Jamie", "Rivera", None, "Demo family contact."),
        ("casey", "Casey", "Patel", None, "Demo friend contact."),
    )
    for key, first_name, last_name, gender, notes in specs:
        contact_id = await _fetch_or_insert(
            conn,
            ctx,
            table_key=tables.CONTACTS,
            select_sql=f"""
                SELECT id FROM {tables.CONTACTS}
                WHERE user_id = $1 AND first_name = $2 AND last_name = $3 AND notes = $4
                ORDER BY id LIMIT 1
            """,
            select_args=(ctx.user_id, first_name, last_name, notes),
            insert_sql=f"""
                INSERT INTO {tables.CONTACTS}
                    (user_id, first_name, last_name, gender, notes, is_self)
                VALUES ($1, $2, $3, $4, $5, FALSE)
                RETURNING id
            """,
            insert_args=(ctx.user_id, first_name, last_name, gender, notes),
        )
        ctx.contacts[key] = contact_id

    for from_key, to_key, rel_type in (
        ("alex", "morgan", "spouse"),
        ("morgan", "alex", "spouse"),
        ("alex", "jamie", "parent"),
        ("morgan", "jamie", "parent"),
        ("alex", "casey", "friend"),
    ):
        await conn.execute(
            f"""
            INSERT INTO {tables.CONTACT_RELATIONSHIPS}
                (user_id, from_contact_id, to_contact_id, relationship_type)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (from_contact_id, to_contact_id, relationship_type) DO NOTHING
            """,
            ctx.user_id,
            ctx.contacts[from_key],
            ctx.contacts[to_key],
            rel_type,
        )


async def _seed_focus_tag(conn: asyncpg.Connection, ctx: DemoContext, name: str, color: str) -> int:
    row = await conn.fetchrow(
        f"""
        INSERT INTO {tables.FOCUS_TAGS} (user_id, name, color_hex)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, name) DO UPDATE
        SET color_hex = EXCLUDED.color_hex
        RETURNING id, (xmax = 0) AS inserted
        """,
        ctx.user_id,
        name,
        color,
    )
    if row["inserted"]:
        ctx.stats.inserted_one(tables.FOCUS_TAGS)
    else:
        ctx.stats.reused_one(tables.FOCUS_TAGS)
    return int(row["id"])


async def _seed_focus_node(
    conn: asyncpg.Connection,
    ctx: DemoContext,
    key: str,
    *,
    parent_id: int | None,
    kind: str,
    title: str,
    notes: str,
    status: str,
    sort_order: int,
    color: str | None = None,
    reference_type: str | None = None,
    reference_id: int | None = None,
) -> int:
    node_id = await _fetch_or_insert(
        conn,
        ctx,
        table_key=tables.FOCUS_NODES,
        select_sql=f"""
            SELECT id FROM {tables.FOCUS_NODES}
            WHERE user_id = $1
              AND parent_id IS NOT DISTINCT FROM $2
              AND kind = $3
              AND title = $4
            ORDER BY id LIMIT 1
        """,
        select_args=(ctx.user_id, parent_id, kind, title),
        insert_sql=f"""
            INSERT INTO {tables.FOCUS_NODES}
                (
                    user_id, parent_id, kind, sort_order, title, notes,
                    status, node_color_hex, reference_target_type, reference_target_id
                )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        """,
        insert_args=(
            ctx.user_id,
            parent_id,
            kind,
            sort_order,
            title,
            notes,
            status,
            color,
            reference_type,
            reference_id,
        ),
    )
    ctx.focus_nodes[key] = node_id
    return node_id


async def _seed_focus(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    origin_id = await conn.fetchval(
        f"""
        SELECT id FROM {tables.FOCUS_NODES}
        WHERE user_id = $1 AND is_origin = TRUE
        LIMIT 1
        """,
        ctx.user_id,
    )
    if origin_id is None:
        origin_id = await conn.fetchval(
            f"""
            INSERT INTO {tables.FOCUS_NODES}
                (user_id, kind, sort_order, title, notes, status, is_origin, node_color_hex)
            VALUES ($1, 'list', 0, 'Demo Focus Origin', 'Demo origin generated for local development.', 'active', TRUE, '#8B5CF6')
            RETURNING id
            """,
            ctx.user_id,
        )
        ctx.stats.inserted_one(tables.FOCUS_NODES)
    else:
        ctx.stats.reused_one(tables.FOCUS_NODES)
    ctx.focus_nodes["origin"] = int(origin_id)

    work = await _seed_focus_node(
        conn,
        ctx,
        "work",
        parent_id=int(origin_id),
        kind="list",
        title="Demo: Work Sprint",
        notes="Demo list for active work.",
        status="active",
        sort_order=0,
        color="#8B5CF6",
    )
    life = await _seed_focus_node(
        conn,
        ctx,
        "life",
        parent_id=int(origin_id),
        kind="list",
        title="Demo: Life Admin",
        notes="Demo list for personal tasks.",
        status="active",
        sort_order=1,
        color="#06B6D4",
    )
    task = await _seed_focus_node(
        conn,
        ctx,
        "task",
        parent_id=work,
        kind="item",
        title="Demo: Draft launch checklist",
        notes="Try completing or timing this task.",
        status="active",
        sort_order=0,
    )
    await _seed_focus_node(
        conn,
        ctx,
        "completed",
        parent_id=work,
        kind="item",
        title="Demo: Review archived website notes",
        notes="Completed demo task.",
        status="completed",
        sort_order=1,
    )
    await _seed_focus_node(
        conn,
        ctx,
        "project-record",
        parent_id=work,
        kind="record",
        title="Demo: Launch Dashboard Project",
        notes="Linked demo project record.",
        status="active",
        sort_order=2,
        reference_type="project",
        reference_id=ctx.projects["launch"],
    )
    await _seed_focus_node(
        conn,
        ctx,
        "finance-record",
        parent_id=life,
        kind="record",
        title="Demo: USB Microphone Purchase",
        notes="Linked demo finance purchase.",
        status="paused",
        sort_order=0,
        reference_type="finance_transaction",
        reference_id=ctx.finance_transactions["mic"],
    )
    await _seed_focus_node(
        conn,
        ctx,
        "contact-record",
        parent_id=life,
        kind="record",
        title="Demo: Casey Patel Contact",
        notes="Linked demo contact record.",
        status="active",
        sort_order=1,
        reference_type="contact",
        reference_id=ctx.contacts["casey"],
    )

    focus_tag = await _seed_focus_tag(conn, ctx, "Demo Focus", "#8B5CF6")
    await conn.execute(
        f"""
        INSERT INTO {tables.FOCUS_NODE_TAGS} (node_id, tag_id)
        VALUES ($1, $2), ($3, $2)
        ON CONFLICT (node_id, tag_id) DO NOTHING
        """,
        work,
        focus_tag,
        life,
    )
    started_at = datetime(2026, 6, 19, 13, 0, tzinfo=timezone.utc)
    exists = await conn.fetchval(
        f"""
        SELECT id FROM {tables.FOCUS_NODE_TIME_ENTRIES}
        WHERE user_id = $1 AND node_id = $2 AND started_at = $3
        LIMIT 1
        """,
        ctx.user_id,
        task,
        started_at,
    )
    if exists is None:
        await conn.execute(
            f"""
            INSERT INTO {tables.FOCUS_NODE_TIME_ENTRIES}
                (
                    user_id, node_id, status, started_at, ended_at,
                    accumulated_paused_seconds, duration_seconds
                )
            VALUES ($1, $2, 'ended', $3, $4, 300, 2700)
            """,
            ctx.user_id,
            task,
            started_at,
            started_at + timedelta(minutes=50),
        )
        ctx.stats.inserted_one(tables.FOCUS_NODE_TIME_ENTRIES)
    else:
        ctx.stats.reused_one(tables.FOCUS_NODE_TIME_ENTRIES)


async def _seed_chat(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    conversation_id = await _fetch_or_insert(
        conn,
        ctx,
        table_key=tables.CONVERSATIONS,
        select_sql=f"""
            SELECT id FROM {tables.CONVERSATIONS}
            WHERE user_id = $1 AND title = 'Demo: Planning Session'
            ORDER BY id LIMIT 1
        """,
        select_args=(ctx.user_id,),
        insert_sql=f"""
            INSERT INTO {tables.CONVERSATIONS}
                (user_id, title, driver_agent_id, sort_order)
            VALUES ($1, 'Demo: Planning Session', 'keel', 0)
            RETURNING id
        """,
        insert_args=(ctx.user_id,),
    )
    has_messages = await conn.fetchval(
        f"SELECT 1 FROM {tables.MESSAGES} WHERE conversation_id = $1 LIMIT 1",
        conversation_id,
    )
    if has_messages is None:
        await conn.executemany(
            f"""
            INSERT INTO {tables.MESSAGES}
                (conversation_id, role, content, agent_id, provider, model)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            (
                (
                    conversation_id,
                    "user",
                    "Help me plan the demo launch checklist.",
                    None,
                    None,
                    None,
                ),
                (
                    conversation_id,
                    "assistant",
                    "I created a short plan and linked it to your demo Focus sprint.",
                    "keel",
                    "openai",
                    "gpt-4.1-mini",
                ),
            ),
        )
        ctx.stats.inserted_one(tables.MESSAGES)
        ctx.stats.inserted_one(tables.MESSAGES)
    else:
        ctx.stats.reused_one(tables.MESSAGES)

    rule_exists = await conn.fetchval(
        f"""
        SELECT id FROM {tables.CHAT_RULES}
        WHERE user_id = $1 AND title = 'Demo: concise planning'
        LIMIT 1
        """,
        ctx.user_id,
    )
    if rule_exists is None:
        await conn.execute(
            f"""
            INSERT INTO {tables.CHAT_RULES}
                (user_id, title, content, agent_ids, sort_order)
            VALUES ($1, 'Demo: concise planning', 'Keep demo planning responses concise and action-oriented.', ARRAY['keel'], 0)
            """,
            ctx.user_id,
        )
        ctx.stats.inserted_one(tables.CHAT_RULES)
    else:
        ctx.stats.reused_one(tables.CHAT_RULES)

    await conn.execute(
        f"""
        INSERT INTO {tables.AGENT_LLM_PREFERENCES}
            (user_id, agent_id, llm_provider, llm_model)
        VALUES ($1, 'keel', 'openai', 'gpt-4.1-mini')
        ON CONFLICT (user_id, agent_id) DO NOTHING
        """,
        ctx.user_id,
    )


async def _seed_all(conn: asyncpg.Connection, user_id: int) -> SeedStats:
    ctx = DemoContext(user_id=user_id, stats=SeedStats())
    await _seed_user_preferences(conn, ctx)
    await _seed_projects(conn, ctx)
    await _seed_finance(conn, ctx)
    await _seed_contacts(conn, ctx)
    await _seed_focus(conn, ctx)
    await _seed_chat(conn, ctx)
    return ctx.stats


async def _run(args: argparse.Namespace) -> None:
    enabled_raw = args.demo_seed_enabled
    enabled = _parse_bool(enabled_raw if enabled_raw is not None else os.environ.get("DEMO_SEED_ENABLED", ""))
    if not enabled:
        print("Demo seed skipped because DEMO_SEED_ENABLED is false.")
        return

    email = _demo_user_email(args.user_email)
    conn = await asyncpg.connect(_database_url())
    tx = conn.transaction()
    await tx.start()
    try:
        user_id = await _resolve_user_id(
            conn,
            email,
            wait_seconds=args.wait_seconds,
            retry_interval_seconds=args.retry_interval_seconds,
        )
        stats = await _seed_all(conn, user_id)
        if args.dry_run:
            await tx.rollback()
            print("Dry run complete; rolled back demo seed changes.")
        else:
            await tx.commit()
            print("Demo data ready for the configured demo user.")
        print(stats.summary())
    except Exception:
        await tx.rollback()
        raise
    finally:
        await conn.close()


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--user-email", help="Existing local user email. Defaults to DEMO_USER_EMAIL.")
    parser.add_argument(
        "--demo-seed-enabled",
        help="Boolean override for DEMO_SEED_ENABLED.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Roll back after validating seed inserts.")
    parser.add_argument("--wait-seconds", type=int, default=DEFAULT_WAIT_SECONDS)
    parser.add_argument("--retry-interval-seconds", type=int, default=DEFAULT_RETRY_INTERVAL_SECONDS)
    return parser.parse_args()


def main() -> int:
    try:
        asyncio.run(_run(_parse_args()))
    except DemoSeedError as exc:
        print(f"Demo seed error: {exc}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
