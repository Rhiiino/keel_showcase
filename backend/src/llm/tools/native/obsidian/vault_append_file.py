# stack_sandbox/backend/src/llm/tools/native/obsidian/vault_append_file.py
"""Obsidian tool: append text to a file, creating it if missing."""

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
    """Append text to the end of a file, creating the file (and parent folders) if it does not exist. Use for adding entries to a running note (e.g. a daily log) without rewriting existing content."""
    path = resolve_vault_path(arguments.get("path"))
    content = arguments.get("content")
    if not isinstance(content, str):
        raise AppError("'content' (string) is required.", status_code=400)
    if path.exists() and path.is_dir():
        raise AppError(f"Path is a directory: {to_vault_relative(path)}", status_code=400)

    existing = read_text(path) if path.exists() else ""
    size_bytes = write_text(path, existing + content)
    return {"path": to_vault_relative(path), "size_bytes": size_bytes}


TOOL_DEFINITION = ToolDefinition(
    name="vault_append_file",
    category=OBSIDIAN,
    description=(
        "Append text to the end of a file, creating the file (and parent folders) if "
        "it does not exist. Use for adding entries to a running note (e.g. a daily log) "
        "without rewriting existing content."
    ),
    parameters={
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "Vault-relative path to append to, e.g. 'Daily/2026-06-01.md'.",
            },
            "content": {
                "type": "string",
                "description": "Text to append verbatim. Include a leading newline if you need a line break.",
            },
        },
        "required": ["path", "content"],
        "additionalProperties": False,
    },
    returns="{ path: string, size_bytes: integer }",
    executor=execute,
)
