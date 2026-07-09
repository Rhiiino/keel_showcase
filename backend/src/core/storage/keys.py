# keel_api/src/core/storage/keys.py

"""Object key builders and validation."""

from __future__ import annotations

from pathlib import PurePosixPath
from uuid import UUID


def build_user_media_key(user_id: int, media_id: UUID, extension: str) -> str:
    """Build a storage key for one user-owned media object."""
    ext = extension if extension.startswith(".") else f".{extension}"
    return f"users/{user_id}/{media_id}{ext}"


def validate_storage_key(storage_key: str) -> str:
    """Return a normalized storage key or raise ValueError."""
    trimmed = (storage_key or "").strip()
    if not trimmed:
        raise ValueError("Invalid storage key.")

    pure = PurePosixPath(trimmed)
    if pure.is_absolute() or ".." in pure.parts:
        raise ValueError("Invalid storage key.")

    return trimmed
