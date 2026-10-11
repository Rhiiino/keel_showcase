# keel_api/scripts/db/migrations/2026_06_20_general_updates/data.py
"""Migrate filesystem media from legacy tables/paths into Garage (S3).

Run after schema.sql and before schema_cleanup.sql.

Usage (from keel_api/):
    python scripts/db/migrations/2026_06_20_general_updates/data.py

Requires DATABASE_URL, S3_* env vars, and legacy path env vars if files remain on disk:
    PROJECTS_MEDIA_PATH, SHOP_MEDIA_PATH, CONTACTS_MEDIA_PATH
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

import asyncpg

from core.storage import get_storage_backend
from core.storage.keys import build_user_media_key


MAP_FILE = "migration_media_map.jsonl"


@dataclass(frozen=True)
class LegacyFile:
    source_table: str
    source_id: int | str
    user_id: int
    entity_type: str
    entity_id: int
    role: str
    storage_key: str
    original_filename: str
    mime_type: str
    byte_size: int
    media_kind: str
    media_root: Path


def _media_root(env_var: str) -> Path | None:
    raw = (os.environ.get(env_var) or "").strip()
    if not raw:
        return None
    path = Path(raw).expanduser()
    return path if path.is_dir() else None


def _resolve_path(media_root: Path, storage_key: str) -> Path | None:
    pure = Path(storage_key.strip())
    if pure.is_absolute() or any(part == ".." for part in pure.parts):
        return None
    resolved = (media_root / pure).resolve()
    try:
        resolved.relative_to(media_root.resolve())
    except ValueError:
        return None
    return resolved if resolved.is_file() else None


def _extension_for(filename: str, mime: str) -> str:
    name = Path(filename).suffix.lower()
    if name:
        return name
    mime_map = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "application/pdf": ".pdf",
        "model/gltf-binary": ".glb",
    }
    return mime_map.get(mime, ".bin")


def _classify_kind(mime: str, explicit: str | None = None) -> str:
    if explicit:
        return explicit
    if mime.startswith("image/"):
        return "image"
    if mime.startswith("video/"):
        return "video"
    if mime.startswith("audio/"):
        return "audio"
    if mime == "model/gltf-binary":
        return "model_3d"
    if mime == "application/pdf":
        return "document"
    return "other"


async def _collect_legacy_files(conn: asyncpg.Connection) -> list[LegacyFile]:
    files: list[LegacyFile] = []
    projects_root = _media_root("PROJECTS_MEDIA_PATH")
    shop_root = _media_root("SHOP_MEDIA_PATH")
    contacts_root = _media_root("CONTACTS_MEDIA_PATH")

    if await conn.fetchval(
        "SELECT to_regclass('public.project_media')"
    ):
        rows = await conn.fetch(
            """
            SELECT id, project_id, user_id, original_filename, storage_key,
                   mime_type, byte_size, media_kind
            FROM project_media
            ORDER BY id
            """
        )
        for row in rows:
            if projects_root is None:
                continue
            files.append(
                LegacyFile(
                    source_table="project_media",
                    source_id=int(row["id"]),
                    user_id=int(row["user_id"]),
                    entity_type="project",
                    entity_id=int(row["project_id"]),
                    role="gallery",
                    storage_key=str(row["storage_key"]),
                    original_filename=str(row["original_filename"]),
                    mime_type=str(row["mime_type"]),
                    byte_size=int(row["byte_size"]),
                    media_kind=str(row["media_kind"]),
                    media_root=projects_root,
                )
            )

        cover_rows = await conn.fetch(
            """
            SELECT id, user_id, cover_media_id, cover_storage_key,
                   cover_mime_type, cover_byte_size
            FROM projects
            WHERE cover_storage_key IS NOT NULL
            """
        )
        for row in cover_rows:
            if projects_root is None:
                continue
            files.append(
                LegacyFile(
                    source_table="projects.cover_storage_key",
                    source_id=int(row["id"]),
                    user_id=int(row["user_id"]),
                    entity_type="project",
                    entity_id=int(row["id"]),
                    role="cover",
                    storage_key=str(row["cover_storage_key"]),
                    original_filename=Path(str(row["cover_storage_key"])).name,
                    mime_type=str(row["cover_mime_type"] or "application/octet-stream"),
                    byte_size=int(row["cover_byte_size"] or 0),
                    media_kind="image",
                    media_root=projects_root,
                )
            )

        cover_media_rows = await conn.fetch(
            """
            SELECT p.id AS project_id, p.user_id, pm.id AS media_id,
                   pm.original_filename, pm.storage_key, pm.mime_type,
                   pm.byte_size, pm.media_kind
            FROM projects p
            JOIN project_media pm ON pm.id = p.cover_media_id
            """
        )
        for row in cover_media_rows:
            if projects_root is None:
                continue
            files.append(
                LegacyFile(
                    source_table="projects.cover_media_id",
                    source_id=int(row["media_id"]),
                    user_id=int(row["user_id"]),
                    entity_type="project",
                    entity_id=int(row["project_id"]),
                    role="cover",
                    storage_key=str(row["storage_key"]),
                    original_filename=str(row["original_filename"]),
                    mime_type=str(row["mime_type"]),
                    byte_size=int(row["byte_size"]),
                    media_kind=str(row["media_kind"]),
                    media_root=projects_root,
                )
            )

    if await conn.fetchval("SELECT to_regclass('public.shop_item_media')"):
        rows = await conn.fetch(
            """
            SELECT id, item_id, user_id, original_filename, storage_key,
                   mime_type, byte_size, media_kind
            FROM shop_item_media
            ORDER BY id
            """
        )
        for row in rows:
            if shop_root is None:
                continue
            files.append(
                LegacyFile(
                    source_table="shop_item_media",
                    source_id=int(row["id"]),
                    user_id=int(row["user_id"]),
                    entity_type="shop_item",
                    entity_id=int(row["item_id"]),
                    role="gallery",
                    storage_key=str(row["storage_key"]),
                    original_filename=str(row["original_filename"]),
                    mime_type=str(row["mime_type"]),
                    byte_size=int(row["byte_size"]),
                    media_kind=str(row["media_kind"]),
                    media_root=shop_root,
                )
            )

        cover_rows = await conn.fetch(
            """
            SELECT id, user_id, cover_media_id, cover_storage_key,
                   cover_mime_type, cover_byte_size
            FROM shop_items
            WHERE cover_storage_key IS NOT NULL
               OR cover_media_id IS NOT NULL
            """
        )
        for row in cover_rows:
            if shop_root is None:
                continue
            if row["cover_storage_key"]:
                files.append(
                    LegacyFile(
                        source_table="shop_items.cover_storage_key",
                        source_id=int(row["id"]),
                        user_id=int(row["user_id"]),
                        entity_type="shop_item",
                        entity_id=int(row["id"]),
                        role="cover",
                        storage_key=str(row["cover_storage_key"]),
                        original_filename=Path(str(row["cover_storage_key"])).name,
                        mime_type=str(row["cover_mime_type"] or "application/octet-stream"),
                        byte_size=int(row["cover_byte_size"] or 0),
                        media_kind="image",
                        media_root=shop_root,
                    )
                )

    if await conn.fetchval(
        """
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'shop_merchants'
          AND column_name = 'image_storage_key'
        LIMIT 1
        """
    ):
        rows = await conn.fetch(
            """
            SELECT id, user_id, image_storage_key, image_mime_type, image_byte_size
            FROM shop_merchants
            WHERE image_storage_key IS NOT NULL
            """
        )
        for row in rows:
            if shop_root is None:
                continue
            files.append(
                LegacyFile(
                    source_table="shop_merchants",
                    source_id=int(row["id"]),
                    user_id=int(row["user_id"]),
                    entity_type="shop_merchant",
                    entity_id=int(row["id"]),
                    role="logo",
                    storage_key=str(row["image_storage_key"]),
                    original_filename=Path(str(row["image_storage_key"])).name,
                    mime_type=str(row["image_mime_type"] or "image/png"),
                    byte_size=int(row["image_byte_size"] or 0),
                    media_kind="image",
                    media_root=shop_root,
                )
            )

    if await conn.fetchval(
        """
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'contacts'
          AND column_name = 'photo_storage_key'
        LIMIT 1
        """
    ):
        rows = await conn.fetch(
            """
            SELECT id, photo_storage_key, photo_mime_type, photo_byte_size
            FROM contacts
            WHERE photo_storage_key IS NOT NULL
            """
        )
        for row in rows:
            if contacts_root is None:
                continue
            files.append(
                LegacyFile(
                    source_table="contacts",
                    source_id=int(row["id"]),
                    user_id=0,
                    entity_type="contact",
                    entity_id=int(row["id"]),
                    role="photo",
                    storage_key=str(row["photo_storage_key"]),
                    original_filename=Path(str(row["photo_storage_key"])).name,
                    mime_type=str(row["photo_mime_type"] or "image/png"),
                    byte_size=int(row["photo_byte_size"] or 0),
                    media_kind="image",
                    media_root=contacts_root,
                )
            )

    return files


async def _migrate_file(
    conn: asyncpg.Connection,
    backend,
    item: LegacyFile,
    map_path: Path,
) -> None:
    path = _resolve_path(item.media_root, item.storage_key)
    if path is None:
        print(f"skip missing file: {item.source_table}:{item.source_id} -> {item.storage_key}")
        return

    data = path.read_bytes()
    sha256 = hashlib.sha256(data).hexdigest()
    media_id = uuid4()
    ext = _extension_for(item.original_filename, item.mime_type)
    storage_key = build_user_media_key(
        item.user_id if item.user_id else 1,
        media_id,
        ext,
    )
    user_id = item.user_id if item.user_id else 1
    media_kind = _classify_kind(item.mime_type, item.media_kind)

    await conn.execute(
        """
        INSERT INTO media_objects (
            id, user_id, storage_key, original_filename, mime_type,
            byte_size, media_kind, status, sha256
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
        ON CONFLICT (storage_key) DO NOTHING
        """,
        media_id,
        user_id,
        storage_key,
        item.original_filename,
        item.mime_type,
        len(data),
        media_kind,
        sha256,
    )

    await backend.put_object(storage_key, data, content_type=item.mime_type)

    await conn.execute(
        """
        UPDATE media_objects
        SET status = 'ready', byte_size = $2, sha256 = $3, updated_at = NOW()
        WHERE id = $1
        """,
        media_id,
        len(data),
        sha256,
    )

    if item.role in {"cover", "photo", "logo"}:
        await conn.execute(
            """
            DELETE FROM media_attachments
            WHERE entity_type = $1 AND entity_id = $2 AND role = $3
            """,
            item.entity_type,
            item.entity_id,
            item.role,
        )

    await conn.execute(
        """
        INSERT INTO media_attachments (
            media_id, entity_type, entity_id, role, sort_order
        )
        VALUES ($1, $2, $3, $4, 0)
        """,
        media_id,
        item.entity_type,
        item.entity_id,
        item.role,
    )

    record = {
        "old_table": item.source_table,
        "old_id": item.source_id,
        "new_media_id": str(media_id),
        "old_storage_key": item.storage_key,
        "new_storage_key": storage_key,
        "entity_type": item.entity_type,
        "entity_id": item.entity_id,
        "role": item.role,
    }
    with map_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record) + "\n")

    print(f"migrated {item.source_table}:{item.source_id} -> {media_id}")


async def run_migration() -> None:
    database_url = (os.environ.get("DATABASE_URL") or "").strip()
    if not database_url:
        raise SystemExit("DATABASE_URL is not set.")

    map_path = Path(MAP_FILE).resolve()
    if map_path.exists():
        map_path.unlink()

    backend = get_storage_backend()
    conn = await asyncpg.connect(database_url)
    try:
        items = await _collect_legacy_files(conn)
        if not items:
            print("No legacy media rows found (already migrated or empty).")
            return

        async with conn.transaction():
            for item in items:
                await _migrate_file(conn, backend, item, map_path)
    finally:
        await conn.close()

    print(f"done — map written to {map_path}")


def main() -> int:
    try:
        asyncio.run(run_migration())
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
