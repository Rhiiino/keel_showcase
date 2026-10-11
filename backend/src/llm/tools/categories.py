# keel_api/src/llm/tools/categories.py
"""Tool category key constants (stable strings used by native tools and the catalog)."""

from __future__ import annotations

from typing import Literal

CORE = "core"
PROJECTS = "projects"
HAUL = "haul"
WEB = "web"
FOCUS = "focus"
PEOPLE = "people"
COAK = "coak"

ToolCategory = Literal[
    "core",
    "projects",
    "haul",
    "web",
    "focus",
    "people",
    "coak",
]

ALL_CATEGORIES: frozenset[str] = frozenset(
    {CORE, PROJECTS, HAUL, WEB, FOCUS, PEOPLE, COAK}
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
