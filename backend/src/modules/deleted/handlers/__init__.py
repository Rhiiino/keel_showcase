# keel_api/src/modules/deleted/handlers/__init__.py
"""Entity-specific capture, restore, and purge handlers."""

from __future__ import annotations

from modules.deleted.handlers.registry import get_handler, handlers_by_type

__all__ = ["get_handler", "handlers_by_type"]
