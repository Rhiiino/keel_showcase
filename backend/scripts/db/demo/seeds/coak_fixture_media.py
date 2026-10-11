# keel_showcase/backend/scripts/db/demo/seeds/coak_fixture_media.py

from __future__ import annotations

import os
from pathlib import Path
from typing import Any
from uuid import UUID

import asyncpg

from core import tables

from context import DemoContext

_FIXTURES_ROOT = Path(__file__).resolve().parent.parent / "fixtures" / "coak"


async def ensure_fixture_media(
    conn: asyncpg.Connection,
    ctx: DemoContext,
    *,
    user_id: int,
    media_spec: dict[str, Any],
) -> UUID:
    media_id = UUID(str(media_spec["id"]))
    existing = await conn.fetchval(
        f"SELECT id FROM {tables.MEDIA_OBJECTS} WHERE id = $1",
        media_id,
    )
    if existing is None:
        await conn.execute(
            f"""
            INSERT INTO {tables.MEDIA_OBJECTS}
                (id, user_id, storage_key, original_filename, mime_type, byte_size, media_kind, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """,
            media_id,
            user_id,
            media_spec["storage_key"],
            media_spec["original_filename"],
            media_spec["mime_type"],
            int(media_spec["byte_size"]),
            media_spec["media_kind"],
            media_spec.get("status", "ready"),
        )
        ctx.stats.inserted_one(tables.MEDIA_OBJECTS)
    else:
        ctx.stats.reused_one(tables.MEDIA_OBJECTS)

    fixture_rel = str(media_spec["fixture_file"])
    fixture_path = _FIXTURES_ROOT / fixture_rel
    if not fixture_path.exists():
        raise FileNotFoundError(f"Coak fixture media missing: {fixture_path}")

    await _upload_if_missing(media_spec["storage_key"], fixture_path)
    return media_id


async def _upload_if_missing(storage_key: str, fixture_path: Path) -> None:
    import aioboto3

    endpoint = (os.environ.get("S3_ENDPOINT_URL") or "").strip()
    bucket = (os.environ.get("S3_BUCKET") or "").strip()
    access_key = (os.environ.get("S3_ACCESS_KEY") or "").strip()
    secret_key = (os.environ.get("S3_SECRET_KEY") or "").strip()
    region = (os.environ.get("S3_REGION") or "garage").strip()
    if not endpoint or not bucket or not access_key or not secret_key:
        raise RuntimeError("S3 env vars are required to seed Coak fixture media.")

    session = aioboto3.Session()
    async with session.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    ) as client:
        try:
            await client.head_object(Bucket=bucket, Key=storage_key)
            return
        except Exception:
            pass
        body = fixture_path.read_bytes()
        await client.put_object(
            Bucket=bucket,
            Key=storage_key,
            Body=body,
            ContentType=_guess_content_type(fixture_path),
        )


def _guess_content_type(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".png":
        return "image/png"
    if suffix in {".jpg", ".jpeg"}:
        return "image/jpeg"
    return "application/octet-stream"
