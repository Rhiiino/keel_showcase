# keel_api/src/modules/jobs/tasks/backup_lib.py
"""Postgres and Garage backup helpers for the jobs backup task."""

from __future__ import annotations

import logging
import os
import subprocess
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

from core.config import Settings
from core.errors import AppError
from core.storage.s3_backend import S3StorageBackend

logger = logging.getLogger(__name__)


def create_backup_run_dir(settings: Settings) -> Path:
    """Create a timestamped directory under ``settings.backup_dir``."""
    timestamp = datetime.now(UTC).strftime("%Y-%m-%d_%H%M%S")
    run_dir = Path(settings.backup_dir) / timestamp
    run_dir.mkdir(parents=True, exist_ok=True)
    return run_dir


def dump_postgres(database_url: str, dest: Path) -> int:
    """Dump Postgres to a custom-format file; return the file size in bytes."""
    parsed = urlparse(database_url)
    if parsed.scheme not in {"postgresql", "postgres"}:
        raise AppError(
            f"Unsupported DATABASE_URL scheme for pg_dump: {parsed.scheme!r}",
            status_code=500,
        )

    db_name = unquote(parsed.path.lstrip("/"))
    if not db_name:
        raise AppError("DATABASE_URL is missing a database name.", status_code=500)

    host = parsed.hostname or "localhost"
    port = str(parsed.port or 5432)
    user = unquote(parsed.username or "keel")
    password = unquote(parsed.password or "")

    env = os.environ.copy()
    if password:
        env["PGPASSWORD"] = password

    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "pg_dump",
        "-h",
        host,
        "-p",
        port,
        "-U",
        user,
        "-d",
        db_name,
        "-Fc",
        "-f",
        str(dest),
    ]
    logger.info("Running pg_dump to %s", dest)
    try:
        subprocess.run(cmd, check=True, env=env, capture_output=True, text=True)
    except subprocess.CalledProcessError as exc:
        stderr = (exc.stderr or "").strip()
        raise AppError(
            f"pg_dump failed: {stderr or exc}",
            status_code=500,
        ) from exc

    return dest.stat().st_size


async def sync_garage_bucket_to_dir(settings: Settings, dest: Path) -> dict[str, int]:
    """Download all objects from the configured S3 bucket into ``dest``."""
    backend = S3StorageBackend(settings)
    stats = await backend.sync_bucket_to_dir(dest)
    logger.info(
        "Synced %s Garage objects (%s bytes) to %s",
        stats["object_count"],
        stats["total_bytes"],
        dest,
    )
    return stats


async def run_full_backup(settings: Settings) -> dict[str, Any]:
    """Create Postgres dump and Garage mirror under a new timestamped directory."""
    run_dir = create_backup_run_dir(settings)
    postgres_dump = run_dir / "postgres.dump"
    garage_dir = run_dir / "garage"

    postgres_bytes = dump_postgres(settings.database_url, postgres_dump)
    garage_stats = await sync_garage_bucket_to_dir(settings, garage_dir)

    return {
        "backup_dir": str(run_dir),
        "postgres_dump": str(postgres_dump),
        "postgres_bytes": postgres_bytes,
        "garage_dir": str(garage_dir),
        "garage_object_count": garage_stats["object_count"],
        "garage_bytes": garage_stats["total_bytes"],
    }
