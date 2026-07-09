# stack_sandbox/backend/src/llm/tools/native/obsidian/vault_list_entries.py
"""Obsidian tool: list files and folders under a vault directory."""

from __future__ import annotations

from typing import Any

from llm.tools.categories import OBSIDIAN
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.obsidian._vault import resolve_vault_path, to_vault_relative

_MAX_ENTRIES = 500


async def execute(arguments: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    """List files and folders under a vault directory (recursively, up to a depth). Use to discover what exists before reading or to map a folder's structure."""
    root = resolve_vault_path(arguments.get("path") or "")
    depth = arguments.get("depth")
    depth = depth if isinstance(depth, int) and depth > 0 else 2
    extension = arguments.get("extension")
    if isinstance(extension, str) and extension and not extension.startswith("."):
        extension = "." + extension

    base_depth = len(root.parts)
    entries: list[dict[str, str]] = []
    truncated = False

    for current in sorted(root.rglob("*")):
        # Skip Obsidian's internal config directory.
        if ".obsidian" in current.relative_to(root).parts:
            continue
        if len(current.parts) - base_depth > depth:
            continue
        is_dir = current.is_dir()
        if extension and (is_dir or current.suffix != extension):
            continue
        if len(entries) >= _MAX_ENTRIES:
            truncated = True
            break
        entries.append(
            {
                "path": to_vault_relative(current),
                "type": "directory" if is_dir else "file",
            }
        )

    return {
        "path": to_vault_relative(root),
        "entries": entries,
        "total": len(entries),
        "truncated": truncated,
    }


TOOL_DEFINITION = ToolDefinition(
    name="vault_list_entries",
    category=OBSIDIAN,
    description=(
        "List files and folders under a vault directory (recursively, up to a depth). "
        "Use to discover what exists before reading or to map a folder's structure."
    ),
    parameters={
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "Vault-relative folder to list. Omit or use '' for the vault root.",
            },
            "depth": {
                "type": "integer",
                "description": "How many directory levels to descend. Default 2.",
                "default": 2,
            },
            "extension": {
                "type": "string",
                "description": "Optional file extension filter, e.g. 'md' or '.canvas'. Folders are excluded when set.",
            },
        },
        "required": [],
        "additionalProperties": False,
    },
    returns=(
        "{ path: string, entries: [{ path: string, type: 'file'|'directory' }], "
        "total: integer, truncated: boolean } — capped at 500 entries."
    ),
    executor=execute,
)
