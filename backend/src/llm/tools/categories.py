# keel_api/src/llm/tools/categories.py
"""Tool category key constants (stable strings used by native tools and the catalog)."""

from __future__ import annotations

from typing import Literal

CORE = "core"
OBSIDIAN = "obsidian"
PROJECTS = "projects"
HAUL = "haul"
WEB = "web"
AGENDA = "agenda"
CONTACTS = "contacts"

ToolCategory = Literal[
    "core",
    "obsidian",
    "projects",
    "haul",
    "web",
    "agenda",
    "contacts",
]

ALL_CATEGORIES: frozenset[str] = frozenset(
    {CORE, OBSIDIAN, PROJECTS, HAUL, WEB, AGENDA, CONTACTS}
)


def all_categories() -> frozenset[str]:
    """Return category keys from the catalog cache when loaded, else static set."""
    try:
        from llm.catalog.cache import get_catalog_cache

        cache = get_catalog_cache()
        if cache.is_loaded:
            return frozenset(cache.tool_categories.keys())
    except Exception:
        pass
    return ALL_CATEGORIES
