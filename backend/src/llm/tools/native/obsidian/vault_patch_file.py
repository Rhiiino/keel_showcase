# stack_sandbox/backend/src/llm/tools/native/obsidian/vault_patch_file.py
"""Obsidian tool: find-and-replace text within an existing file."""

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import OBSIDIAN
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.obsidian._vault import (
    read_text,
    resolve_vault_path,
    to_vault_relative,
    write_text,
)


async def execute(arguments: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    """Find-and-replace literal text within an existing file — the preferred way to make a targeted edit without rewriting the whole note. Fails if the 'find' text is not present. Read the file first so 'find' matches exactly."""
    path = resolve_vault_path(arguments.get("path"))
    find = arguments.get("find")
    replace = arguments.get("replace")
    if not isinstance(find, str) or find == "":
        raise AppError("A non-empty 'find' string is required.", status_code=400)
    if not isinstance(replace, str):
        raise AppError("'replace' (string) is required.", status_code=400)
    replace_all = bool(arguments.get("replace_all", False))

    text = read_text(path)
    occurrences = text.count(find)
    if occurrences == 0:
        raise AppError(
            f"'find' text not present in {to_vault_relative(path)}.", status_code=404
        )

    if replace_all:
        new_text = text.replace(find, replace)
        replacements = occurrences
    else:
        new_text = text.replace(find, replace, 1)
        replacements = 1

    size_bytes = write_text(path, new_text)
    return {
        "path": to_vault_relative(path),
        "replacements": replacements,
        "size_bytes": size_bytes,
    }


TOOL_DEFINITION = ToolDefinition(
    name="vault_patch_file",
    category=OBSIDIAN,
    description=(
        "Find-and-replace literal text within an existing file — the preferred way to "
        "make a targeted edit without rewriting the whole note. Fails if the 'find' text "
        "is not present. Read the file first so 'find' matches exactly."
    ),
    parameters={
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "Vault-relative path to edit.",
            },
            "find": {
                "type": "string",
                "description": "Exact literal text to locate (not a regex).",
            },
            "replace": {
                "type": "string",
                "description": "Replacement text. Use an empty string to delete the matched text.",
            },
            "replace_all": {
                "type": "boolean",
                "description": "Replace every occurrence. Default false (first match only).",
                "default": False,
            },
        },
        "required": ["path", "find", "replace"],
        "additionalProperties": False,
    },
    returns="{ path: string, replacements: integer, size_bytes: integer }",
    executor=execute,
)
