# stack_sandbox/backend/src/llm/catalog/storage.py

"""Filesystem helpers for committed catalog media assets."""

from __future__ import annotations

from pathlib import Path

from core.config import get_settings
from core.errors import AppError


def default_catalog_assets_root() -> Path:
    """Default `backend/assets/catalog` relative to this package."""
    return (Path(__file__).resolve().parents[3] / "assets" / "catalog").resolve()


def default_catalog_uploads_root() -> Path:
    """Default `backend/assets/catalog-uploads` relative to this package."""
    return (Path(__file__).resolve().parents[3] / "assets" / "catalog-uploads").resolve()


def get_catalog_assets_root() -> Path:
    """Return configured catalog assets root (committed app assets)."""
    raw = (get_settings().catalog_assets_path or "").strip()
    root = Path(raw).expanduser() if raw else default_catalog_assets_root()
    if not root.is_dir():
        raise AppError(
            f"Catalog assets path is not a directory: {root}",
            status_code=503,
        )
    return root.resolve()


def get_catalog_uploads_root() -> Path:
    """Return writable catalog uploads root (user-created agent media)."""
    raw = (get_settings().catalog_uploads_path or "").strip()
    root = Path(raw).expanduser() if raw else default_catalog_uploads_root()
    root.mkdir(parents=True, exist_ok=True)
    return root.resolve()


def _validate_storage_key(storage_key: str) -> Path:
    """Return a safe relative path for a catalog storage key."""
    if not storage_key or not storage_key.strip():
        raise AppError("Invalid storage key.", status_code=400)

    pure = Path(storage_key.strip())
    if pure.is_absolute() or any(part == ".." for part in pure.parts):
        raise AppError("Invalid storage key.", status_code=400)
    return pure


def resolve_catalog_asset_path(storage_key: str) -> Path:
    """Resolve a storage key under uploads first, then committed catalog assets."""
    pure = _validate_storage_key(storage_key)

    uploads_root = get_catalog_uploads_root()
    uploads_candidate = (uploads_root / pure).resolve()
    try:
        uploads_candidate.relative_to(uploads_root)
    except ValueError:
        raise AppError("Invalid storage key.", status_code=400)
    if uploads_candidate.is_file():
        return uploads_candidate

    assets_root = get_catalog_assets_root()
    assets_candidate = (assets_root / pure).resolve()
    try:
        assets_candidate.relative_to(assets_root)
    except ValueError:
        raise AppError("Invalid storage key.", status_code=400)
    if not assets_candidate.is_file():
        raise AppError("Catalog asset not found.", status_code=404)
    return assets_candidate


def write_catalog_upload(storage_key: str, data: bytes) -> Path:
    """Write bytes to the catalog uploads directory for a storage key."""
    pure = _validate_storage_key(storage_key)
    root = get_catalog_uploads_root()
    destination = (root / pure).resolve()
    try:
        destination.relative_to(root)
    except ValueError:
        raise AppError("Invalid storage key.", status_code=400)

    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)
    return destination
