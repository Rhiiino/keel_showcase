# stack_sandbox/backend/src/llm/tools/registry.py
"""Tool definitions and OpenAI schemas from the DB-backed catalog cache."""

from __future__ import annotations

from typing import Any

from llm.tools.contracts import ToolDefinition, ToolExecutor

TOOL_DEFINITIONS: dict[str, ToolDefinition] = {}
TOOL_REGISTRY: list[dict[str, Any]] = []
TOOL_EXECUTORS: dict[str, ToolExecutor] = {}
TOOL_CATEGORY_MAP: dict[str, str] = {}


def refresh_tool_registry() -> None:
    """Sync module-level lookups from the loaded catalog cache.

    Mutates the existing dict/list objects in place so importers that bound names
    at module load (``from llm.tools.registry import TOOL_DEFINITIONS``) still see
    refreshed data after catalog startup.
    """
    from llm.catalog.cache import get_catalog_cache

    tools = get_catalog_cache().tools
    TOOL_DEFINITIONS.clear()
    TOOL_DEFINITIONS.update(tools)
    TOOL_REGISTRY.clear()
    TOOL_REGISTRY.extend(definition.to_openai_schema() for definition in tools.values())
    TOOL_EXECUTORS.clear()
    TOOL_EXECUTORS.update(
        {name: definition.executor for name, definition in tools.items()}
    )
    TOOL_CATEGORY_MAP.clear()
    TOOL_CATEGORY_MAP.update(
        {name: definition.category for name, definition in tools.items()}
    )
