# keel_api/src/modules/jobs/tasks/demo_reset_lib.py
"""Baseline snapshot and restore helpers for the public demo reset."""

from __future__ import annotations

import logging
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

from core.config import Settings
from core.database import close_pool, init_pool
from core.errors import AppError
from core.storage.s3_backend import S3StorageBackend
from modules.jobs.tasks.backup_lib import dump_postgres, sync_garage_bucket_to_dir

logger = logging.getLogger(__name__)


def _parse_database_url(database_url: str) -> dict[str, str]:
    parsed = urlparse(database_url)
    if parsed.scheme not in {"postgresql", "postgres"}:
        raise AppError(
            f"Unsupported DATABASE_URL scheme: {parsed.scheme!r}",
            status_code=500,
        )

    db_name = unquote(parsed.path.lstrip("/"))
    if not db_name:
        raise AppError("DATABASE_URL is missing a database name.", status_code=500)

    return {
        "db_name": db_name,
        "host": parsed.hostname or "localhost",
        "port": str(parsed.port or 5432),
        "user": unquote(parsed.username or "keel"),
        "password": unquote(parsed.password or ""),
    }


def _postgres_env(password: str) -> dict[str, str]:
    env = os.environ.copy()
    if password:
        env["PGPASSWORD"] = password
    return env


def _snapshot_paths(settings: Settings) -> tuple[Path, Path, Path]:
    snapshot_dir = Path(settings.demo_reset_snapshot_dir)
    postgres_dump = snapshot_dir / "postgres.dump"
    garage_dir = snapshot_dir / "garage"
    return snapshot_dir, postgres_dump, garage_dir


def _validate_snapshot(settings: Settings) -> tuple[Path, Path, Path]:
    snapshot_dir, postgres_dump, garage_dir = _snapshot_paths(settings)
    if not postgres_dump.is_file():
        raise AppError(
            f"Demo snapshot missing Postgres dump: {postgres_dump}",
            status_code=500,
        )
    if not garage_dir.is_dir():
        raise AppError(
            f"Demo snapshot missing Garage directory: {garage_dir}",
            status_code=500,
        )
    return snapshot_dir, postgres_dump, garage_dir


def _run_subprocess(cmd: list[str], *, env: dict[str, str], action: str) -> None:
    logger.info("Running %s: %s", action, " ".join(cmd))
    try:
        subprocess.run(cmd, check=True, env=env, capture_output=True, text=True)
    except subprocess.CalledProcessError as exc:
        stderr = (exc.stderr or "").strip()
        raise AppError(
            f"{action} failed: {stderr or exc}",
            status_code=500,
        ) from exc


def _terminate_database_connections(conn: dict[str, str]) -> None:
    env = _postgres_env(conn["password"])
    sql = (
        "SELECT pg_terminate_backend(pid) "
        f"FROM pg_stat_activity WHERE datname = '{conn['db_name']}' "
        "AND pid <> pg_backend_pid();"
    )
    cmd = [
        "psql",
        "-h",
        conn["host"],
        "-p",
        conn["port"],
        "-U",
        conn["user"],
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        sql,
    ]
    _run_subprocess(cmd, env=env, action="Terminate database connections")


def restore_postgres(database_url: str, dump_path: Path) -> int:
    """Restore Postgres from a custom-format dump after terminating active sessions."""
    conn = _parse_database_url(database_url)
    env = _postgres_env(conn["password"])

    _terminate_database_connections(conn)

    cmd = [
        "pg_restore",
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-acl",
        "-h",
        conn["host"],
        "-p",
        conn["port"],
        "-U",
        conn["user"],
        "-d",
        conn["db_name"],
        str(dump_path),
    ]
    _run_subprocess(cmd, env=env, action="pg_restore")
    return dump_path.stat().st_size


async def restore_garage_bucket_from_dir(settings: Settings, src: Path) -> dict[str, int]:
    """Replace the live bucket contents with files from a local snapshot directory."""
    backend = S3StorageBackend(settings)
    deleted_stats = await backend.clear_bucket()
    upload_stats = await backend.sync_dir_to_bucket(src)
    logger.info(
        "Restored Garage bucket from %s (deleted %s objects, uploaded %s objects / %s bytes)",
        src,
        deleted_stats["deleted_count"],
        upload_stats["object_count"],
        upload_stats["total_bytes"],
    )
    return {
        "deleted_count": deleted_stats["deleted_count"],
        "object_count": upload_stats["object_count"],
        "total_bytes": upload_stats["total_bytes"],
    }


async def create_baseline_snapshot(settings: Settings) -> dict[str, Any]:
    """Write the current Postgres + Garage state to the fixed demo baseline directory."""
    snapshot_dir, postgres_dump, garage_dir = _snapshot_paths(settings)
    snapshot_dir.mkdir(parents=True, exist_ok=True)

    if garage_dir.exists():
        shutil.rmtree(garage_dir)

    postgres_bytes = dump_postgres(settings.database_url, postgres_dump)
    garage_stats = await sync_garage_bucket_to_dir(settings, garage_dir)

    return {
        "snapshot_dir": str(snapshot_dir),
        "postgres_dump": str(postgres_dump),
        "postgres_bytes": postgres_bytes,
        "garage_dir": str(garage_dir),
        "garage_object_count": garage_stats["object_count"],
        "garage_bytes": garage_stats["total_bytes"],
    }


async def restore_baseline_snapshot(settings: Settings) -> dict[str, Any]:
    """Wipe the live demo database and Garage bucket, then restore from the baseline snapshot."""
    _, postgres_dump, garage_dir = _validate_snapshot(settings)

    await close_pool()
    try:
        postgres_bytes = restore_postgres(settings.database_url, postgres_dump)
        garage_stats = await restore_garage_bucket_from_dir(settings, garage_dir)
    finally:
        await init_pool()

    return {
        "snapshot_dir": str(settings.demo_reset_snapshot_dir),
        "postgres_dump": str(postgres_dump),
        "postgres_bytes": postgres_bytes,
        "garage_dir": str(garage_dir),
        "garage_deleted_count": garage_stats["deleted_count"],
        "garage_object_count": garage_stats["object_count"],
        "garage_bytes": garage_stats["total_bytes"],
    }
