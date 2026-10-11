# keel_api/scripts/db/seed/prod_seed_key_data.py
"""Seed production key data for one user: contacts, projects, and Focus hub.

Usage (from keel_api/ with PYTHONPATH=src):
    python scripts/db/seed/prod_seed_key_data.py --user-email you@example.com

Requires DATABASE_URL and S3_* env vars (Garage).
Binary assets must exist under scripts/db/seed/assets/{contacts,projects}/ (gitignored).
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import os
import sys
from pathlib import Path
from uuid import uuid4

import asyncpg

from core.storage import get_storage_backend
from core.storage.keys import build_user_media_key

TARGET_USER_PLACEHOLDER = "__TARGET_USER_ID__"
SEED_TEMPLATE_USER_ID = 1

SENTINEL_CONTACT_FIRST = "Rajan"
SENTINEL_CONTACT_LAST = "Ittyadathu"
SENTINEL_PROJECT_TITLE = "Rhino Solutions"

CONTACT_PHOTO_SPECS: tuple[tuple[str, str | None, str], ...] = (
    ("Rajan", "Ittyadathu", "rajan-ittyadathu.png"),
    ("Anumol", "Thomas", "anumol-thomas.png"),
    ("Ansa", "Thomas", "ansa-thomas.png"),
    ("Midhun", "Raj", "midhun-raj.png"),
    ("Anita", "Raj", "anita-raj.png"),
    ("Phillip", None, "thircoth-appachen.png"),
    ("Alice", None, "thircoth-ammachi.png"),
    ("Kuravilla", "Appachen", "ittyadathu-appachen.png"),
    ("Ittyadathu", "Ammachi", "ittyadathu-ammachi.png"),
    ("Susumma", "Josa", "susamma-jose.png"),
    ("Appapy", None, "appapy.png"),
    ("Jose", "Varghese", "jose-varghese.png"),
    ("Roshen", "Jose", "roshen-jose.png"),
    ("Chelsy", "Jose", "chelsy-jose.png"),
    ("Shiny", "Aunty", "shiny-aunty.png"),
    ("Amal", "Joseph", "amal-joseph.png"),
    ("Athul", "Joseph", "athul-joseph.png"),
    ("Johnnypappy", None, "johnnypappy.png"),
    ("Valsamma", "Aunty", "valsamma-aunty.png"),
    ("Joel", None, "joel.png"),
    ("Joshni", None, "joshni.png"),
    ("Johanna", None, "johanna.png"),
    ("Linson", "Rajan", "linson-rajan.png"),
    ("Cristin", "Chechi", "cristin-chechi.png"),
)

PROJECT_MEDIA_SPECS: tuple[tuple[int, str, str, str], ...] = (
    (2, "logo.png", "cover", "1/2/media/3.png"),
    (2, "rhino.glb", "gallery", "1/2/media/4.glb"),
    (3, "keel.png", "cover", "1/3/media/5.png"),
    (3, "model.glb", "gallery", "1/3/media/6.glb"),
)

MIME_BY_EXT = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".glb": "model/gltf-binary",
}

KIND_BY_EXT = {
    ".png": "image",
    ".jpg": "image",
    ".jpeg": "image",
    ".webp": "image",
    ".gif": "image",
    ".glb": "model_3d",
}


class SeedError(Exception):
    """Fatal seed error with a user-facing message."""


def _seed_root() -> Path:
    return Path(__file__).resolve().parent


def _sql_dir() -> Path:
    return _seed_root() / "sql"


def _assets_dir(module: str) -> Path:
    return _seed_root() / "assets" / module


def _database_url() -> str:
    raw = (os.environ.get("DATABASE_URL") or "").strip()
    if not raw:
        raise SeedError("DATABASE_URL is not set.")
    return raw


def _load_sql(filename: str, *, user_id: int | None = None) -> str:
    path = _sql_dir() / filename
    if not path.is_file():
        raise SeedError(f"Seed SQL file not found: {path}")
    sql_text = path.read_text(encoding="utf-8")
    if user_id is not None:
        sql_text = sql_text.replace(TARGET_USER_PLACEHOLDER, str(user_id))
    return sql_text


async def _upload_and_attach(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    entity_type: str,
    entity_id: int,
    role: str,
    filename: str,
    data: bytes,
    mime_type: str,
    media_kind: str,
) -> None:
    """Insert media_objects row, upload to Garage, and attach to entity."""
    backend = get_storage_backend()
    media_id = uuid4()
    extension = Path(filename).suffix or ".bin"
    storage_key = build_user_media_key(user_id, media_id, extension)
    sha256 = hashlib.sha256(data).hexdigest()

    await conn.execute(
        """
        INSERT INTO media_objects (
            id, user_id, storage_key, original_filename, mime_type,
            byte_size, media_kind, status, sha256
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
        """,
        media_id,
        user_id,
        storage_key,
        filename,
        mime_type,
        len(data),
        media_kind,
        sha256,
    )
    await backend.put_object(storage_key, data, content_type=mime_type)
    await conn.execute(
        """
        UPDATE media_objects
        SET status = 'ready', updated_at = NOW()
        WHERE id = $1
        """,
        media_id,
    )

    if role in {"cover", "photo", "logo"}:
        await conn.execute(
            """
            DELETE FROM media_attachments
            WHERE entity_type = $1 AND entity_id = $2 AND role = $3
            """,
            entity_type,
            entity_id,
            role,
        )

    await conn.execute(
        """
        INSERT INTO media_attachments (media_id, entity_type, entity_id, role, sort_order)
        VALUES ($1, $2, $3, $4, 0)
        """,
        media_id,
        entity_type,
        entity_id,
        role,
    )


async def _resolve_user_id(conn: asyncpg.Connection, email: str) -> int:
    rows = await conn.fetch(
        """
        SELECT id
        FROM users
        WHERE lower(email) = lower($1)
        ORDER BY id
        """,
        email.strip(),
    )
    if not rows:
        raise SeedError(f"No user found with email {email!r}.")
    if len(rows) > 1:
        ids = [int(row["id"]) for row in rows]
        raise SeedError(
            f"Multiple users share email {email!r}: user ids {ids}. Resolve manually.",
        )
    return int(rows[0]["id"])


async def _contacts_already_seeded(conn: asyncpg.Connection) -> bool:
    row = await conn.fetchrow(
        """
        SELECT 1
        FROM contacts
        WHERE first_name = $1 AND last_name = $2
        LIMIT 1
        """,
        SENTINEL_CONTACT_FIRST,
        SENTINEL_CONTACT_LAST,
    )
    return row is not None


async def _projects_already_seeded(conn: asyncpg.Connection, user_id: int) -> bool:
    row = await conn.fetchrow(
        """
        SELECT 1
        FROM projects
        WHERE user_id = $1
          AND title = $2
        LIMIT 1
        """,
        user_id,
        SENTINEL_PROJECT_TITLE,
    )
    return row is not None


async def _focus_already_seeded(conn: asyncpg.Connection, user_id: int) -> bool:
    row = await conn.fetchrow(
        """
        SELECT 1
        FROM focus_nodes
        WHERE user_id = $1
          AND is_origin = TRUE
        LIMIT 1
        """,
        user_id,
    )
    return row is not None


async def _contact_id_for_name(
    conn: asyncpg.Connection,
    first_name: str,
    last_name: str | None,
) -> int | None:
    if last_name:
        row = await conn.fetchrow(
            """
            SELECT id
            FROM contacts
            WHERE first_name = $1 AND last_name = $2
            ORDER BY id
            LIMIT 1
            """,
            first_name,
            last_name,
        )
    else:
        row = await conn.fetchrow(
            """
            SELECT id
            FROM contacts
            WHERE first_name = $1 AND last_name IS NULL
            ORDER BY id
            LIMIT 1
            """,
            first_name,
        )
    return int(row["id"]) if row is not None else None


async def _sync_contact_photos(conn: asyncpg.Connection, user_id: int) -> int:
    assets_dir = _assets_dir("contacts")
    if not assets_dir.is_dir():
        raise SeedError(
            f"Missing contact seed assets directory: {assets_dir}. "
            "Copy scripts/db/seed/assets/contacts to the server before seeding.",
        )

    synced = 0
    for first_name, last_name, filename in CONTACT_PHOTO_SPECS:
        source = assets_dir / filename
        if not source.is_file():
            raise SeedError(f"Missing contact seed asset: contacts/{filename}")

        contact_id = await _contact_id_for_name(conn, first_name, last_name)
        if contact_id is None:
            raise SeedError(
                f"Contact not found after seed: {first_name} {last_name or ''}".strip(),
            )

        data = source.read_bytes()
        await _upload_and_attach(
            conn,
            user_id=user_id,
            entity_type="contact",
            entity_id=contact_id,
            role="photo",
            filename=filename,
            data=data,
            mime_type="image/png",
            media_kind="image",
        )
        synced += 1
    return synced


async def _sync_project_media(conn: asyncpg.Connection, user_id: int) -> int:
    assets_dir = _assets_dir("projects")
    if not assets_dir.is_dir():
        raise SeedError(
            f"Missing project seed assets directory: {assets_dir}. "
            "Copy scripts/db/seed/assets/projects to the server before seeding.",
        )

    synced = 0
    for project_id, filename, role, asset_key in PROJECT_MEDIA_SPECS:
        source = assets_dir / asset_key
        if not source.is_file():
            raise SeedError(f"Missing project seed asset: projects/{asset_key}")

        ext = Path(filename).suffix.lower()
        mime_type = MIME_BY_EXT.get(ext, "application/octet-stream")
        media_kind = KIND_BY_EXT.get(ext, "other")
        data = source.read_bytes()
        await _upload_and_attach(
            conn,
            user_id=user_id,
            entity_type="project",
            entity_id=project_id,
            role=role,
            filename=filename,
            data=data,
            mime_type=mime_type,
            media_kind=media_kind,
        )
        synced += 1
    return synced


async def _seed_contacts(conn: asyncpg.Connection, user_id: int) -> str:
    if await _contacts_already_seeded(conn):
        raise SeedError(
            "Contacts seed data already exists (sentinel contact found). "
            "Aborting to avoid duplicate production data.",
        )

    sql_text = _load_sql("024_contacts.sql")
    await conn.execute(sql_text)
    synced = await _sync_contact_photos(conn, user_id)
    return f"contacts seeded ({synced} photos synced to Garage)"


async def _seed_projects(conn: asyncpg.Connection, user_id: int) -> str:
    if await _projects_already_seeded(conn, user_id):
        raise SeedError(
            "Projects seed data already exists for this user. "
            "Aborting to avoid duplicate production data.",
        )

    sql_text = _load_sql("025_projects.sql", user_id=user_id)
    await conn.execute(sql_text)
    synced = await _sync_project_media(conn, user_id)
    project_count = await conn.fetchval(
        "SELECT count(*) FROM projects WHERE user_id = $1",
        user_id,
    )
    return f"projects seeded ({project_count} projects, {synced} media files synced to Garage)"


async def _seed_focus(conn: asyncpg.Connection, user_id: int) -> str:
    if await _focus_already_seeded(conn, user_id):
        raise SeedError(
            "Focus origin list already exists for this user. "
            "Aborting to avoid duplicate production data.",
        )

    sql_text = _load_sql("023_focus.sql", user_id=user_id)
    await conn.execute(sql_text)

    row = await conn.fetchrow(
        """
        SELECT title, (
            SELECT count(*)
            FROM focus_nodes
            WHERE user_id = $1
        ) AS node_count
        FROM focus_nodes
        WHERE user_id = $1
          AND is_origin = TRUE
        LIMIT 1
        """,
        user_id,
    )
    if row is None:
        raise SeedError("Focus origin list missing after seed.")
    return f"focus seeded ({int(row['node_count'])} nodes, origin={row['title']!r})"


async def run_seed(user_email: str) -> list[str]:
    database_url = _database_url()
    messages: list[str] = []

    conn = await asyncpg.connect(database_url)
    try:
        user_id = await _resolve_user_id(conn, user_email)
        messages.append(f"target user: {user_email} (id={user_id})")

        async with conn.transaction():
            messages.append(await _seed_contacts(conn, user_id))
            messages.append(await _seed_projects(conn, user_id))
            messages.append(await _seed_focus(conn, user_id))
    finally:
        await conn.close()

    return messages


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Seed production contacts, projects, and Focus hub data for one user."
        ),
    )
    parser.add_argument(
        "--user-email",
        required=True,
        help="Email of the user who receives per-user seed data.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv or sys.argv[1:])
    try:
        messages = asyncio.run(run_seed(args.user_email))
    except SeedError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    except asyncpg.PostgresError as exc:
        print(f"database error: {exc}", file=sys.stderr)
        return 1

    for message in messages:
        print(message)
    print("done")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
