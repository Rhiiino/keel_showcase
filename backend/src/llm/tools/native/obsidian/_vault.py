# stack_sandbox/backend/src/llm/tools/native/obsidian/_vault.py
"""Shared helpers for Recall's Obsidian filesystem tools.

Centralizes vault-root resolution, strict path safety (no escaping the vault),
and the low-level read/write/delete primitives so every tool enforces the same
guarantees. Tools raise `AppError` on failure; the orchestrator surfaces that to
the model as `{ "error": ... }`.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from core.config import get_settings
from core.errors import AppError


def get_vault_root() -> Path:
    """Return the configured vault root, or raise 503 if unset/missing."""
    raw = (get_settings().obsidian_vault_path or "").strip()
    if not raw:
        raise AppError(
            "Obsidian vault is not configured (set OBSIDIAN_VAULT_PATH).",
            status_code=503,
        )
    root = Path(raw).expanduser()
    if not root.is_dir():
        raise AppError(
            f"Configured Obsidian vault path is not a directory: {raw}",
            status_code=503,
        )
    return root.resolve()


def resolve_vault_path(relative_path: str) -> Path:
    """Resolve a vault-relative path safely under the vault root.

    Rejects absolute paths and any path that escapes the vault (e.g. via `..`).
    """
    if relative_path is None:
        raise AppError("A vault-relative 'path' is required.", status_code=400)

    candidate = relative_path.strip().lstrip("/")
    if not candidate:
        # Empty / root reference resolves to the vault root itself.
        return get_vault_root()

    pure = Path(candidate)
    if pure.is_absolute() or any(part == ".." for part in pure.parts):
        raise AppError(
            f"Path must be vault-relative and may not contain '..': {relative_path!r}",
            status_code=400,
        )

    root = get_vault_root()
    resolved = (root / pure).resolve()
    try:
        resolved.relative_to(root)
    except ValueError:
        raise AppError(
            f"Resolved path escapes the vault: {relative_path!r}", status_code=400
        )
    return resolved


def to_vault_relative(path: Path) -> str:
    """Render an absolute resolved path back as a vault-relative POSIX string."""
    return path.relative_to(get_vault_root()).as_posix()


def modified_at_iso(path: Path) -> str:
    """Return the file's last-modified time as an ISO 8601 UTC string."""
    ts = path.stat().st_mtime
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


def read_text(path: Path) -> str:
    """Read a file as UTF-8 text, raising AppError if missing or not a file."""
    if not path.exists():
        raise AppError(f"File not found: {to_vault_relative(path)}", status_code=404)
    if not path.is_file():
        raise AppError(f"Not a file: {to_vault_relative(path)}", status_code=400)
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        raise AppError(
            f"File is not UTF-8 text: {to_vault_relative(path)}", status_code=400
        )


def write_text(path: Path, content: str) -> int:
    """Write UTF-8 text, creating parent directories. Returns bytes written."""
    path.parent.mkdir(parents=True, exist_ok=True)
    data = content.encode("utf-8")
    path.write_bytes(data)
    return len(data)
