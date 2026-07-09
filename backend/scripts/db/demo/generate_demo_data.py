# keel_showcase/backend/scripts/db/demo/generate_demo_data.py
"""Generate idempotent demo data for Keel Showcase."""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path

import asyncpg

_DEMO_DIR = Path(__file__).resolve().parent
if str(_DEMO_DIR) not in sys.path:
    sys.path.insert(0, str(_DEMO_DIR))

from context import (  # noqa: E402
    DEFAULT_RETRY_INTERVAL_SECONDS,
    DEFAULT_WAIT_SECONDS,
    FALSE_VALUES,
    TRUE_VALUES,
    DemoContext,
    DemoSeedError,
    SeedStats,
    resolve_user_id,
)
from seeds.chat import seed_chat  # noqa: E402
from seeds.coak import seed_coak  # noqa: E402
from seeds.contacts import seed_contacts  # noqa: E402
from seeds.figures import seed_figures  # noqa: E402
from seeds.finance import seed_finance  # noqa: E402
from seeds.focus import seed_focus  # noqa: E402
from seeds.journal import seed_journal  # noqa: E402
from seeds.preferences import seed_user_preferences  # noqa: E402
from seeds.projects import seed_projects  # noqa: E402
from seeds.services import seed_services  # noqa: E402
from seeds.timeline import seed_timeline  # noqa: E402


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
            "Set DEMO_USER_EMAIL=showcase@keel.demo for the showcase deployment.",
        )
    return value


async def seed_all(conn: asyncpg.Connection, user_id: int) -> SeedStats:
    ctx = DemoContext(user_id=user_id, stats=SeedStats())
    await seed_user_preferences(conn, ctx)
    await seed_projects(conn, ctx)
    await seed_finance(conn, ctx)
    await seed_contacts(conn, ctx)
    await seed_figures(conn, ctx)
    await seed_focus(conn, ctx)
    await seed_chat(conn, ctx)
    await seed_timeline(conn, ctx)
    await seed_journal(conn, ctx)
    await seed_services(conn, ctx)
    await seed_coak(conn, ctx)
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
        user_id = await resolve_user_id(
            conn,
            email,
            wait_seconds=args.wait_seconds,
            retry_interval_seconds=args.retry_interval_seconds,
        )
        stats = await seed_all(conn, user_id)
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
    parser.add_argument("--user-email", help="Existing user email. Defaults to DEMO_USER_EMAIL.")
    parser.add_argument("--demo-seed-enabled", help="Boolean override for DEMO_SEED_ENABLED.")
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
