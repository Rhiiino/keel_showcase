#!/usr/bin/env python3
"""Enqueue a Postgres + Garage backup task.

Usage (from keel_api, with stack running and job_runs migration applied):
  docker compose exec api python scripts/dev/enqueue_backup.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))


async def main() -> None:
    from core.database import close_pool, init_pool
    from modules.jobs.dispatch import enqueue
    from modules.jobs.tasks.backup import create

    await init_pool()
    try:
        run_id = await enqueue(create, triggered_by="manual")
        print(f"Enqueued backup job: {run_id}")
    finally:
        await close_pool()


if __name__ == "__main__":
    asyncio.run(main())
