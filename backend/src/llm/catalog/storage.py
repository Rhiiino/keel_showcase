# stack_sandbox/backend/src/llm/catalog/storage.py

"""Filesystem helpers for committed catalog media assets."""

from __future__ import annotations

from pathlib import Path

from core.config import get_settings
from core.errors import AppError


def default_catalog_assets_root() -> Path:
    """Default `backend/assets/catalog` relative to this package."""
    return (Path(__file__).resolve().parents[3] / "assets" / "catalog").resolve()


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


def resolve_catalog_asset_path(storage_key: str) -> Path:
    """Resolve a storage key safely under the catalog assets root."""
    if not storage_key or not storage_key.strip():
        raise AppError("Invalid storage key.", status_code=400)

    pure = Path(storage_key.strip())
    if pure.is_absolute() or any(part == ".." for part in pure.parts):
        raise AppError("Invalid storage key.", status_code=400)

    root = get_catalog_assets_root()
    resolved = (root / pure).resolve()
    try:
        resolved.relative_to(root)
    except ValueError:
        raise AppError("Invalid storage key.", status_code=400)
    if not resolved.is_file():
        raise AppError("Catalog asset not found.", status_code=404)
    return resolved
