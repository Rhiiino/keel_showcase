# stack_sandbox/backend/src/llm/tools/native/obsidian/vault_read_file.py
"""Obsidian tool: read a file's text content by vault-relative path."""

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import OBSIDIAN
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.obsidian._vault import (
    modified_at_iso,
    read_text,
    resolve_vault_path,
    to_vault_relative,
)


async def execute(arguments: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    """Read the full UTF-8 text of a file in the Obsidian vault. Use to inspect a note before editing or to answer questions about its contents."""
    path = resolve_vault_path(arguments.get("path"))
    content = read_text(path)
    size_bytes = len(content.encode("utf-8"))

    max_bytes = arguments.get("max_bytes")
    truncated = False
    if isinstance(max_bytes, int) and max_bytes > 0 and size_bytes > max_bytes:
        content = content.encode("utf-8")[:max_bytes].decode("utf-8", errors="ignore")
        truncated = True

    return {
        "path": to_vault_relative(path),
        "content": content,
        "size_bytes": size_bytes,
        "truncated": truncated,
        "modified_at": modified_at_iso(path),
    }


TOOL_DEFINITION = ToolDefinition(
    name="vault_read_file",
    category=OBSIDIAN,
    description=(
        "Read the full UTF-8 text of a file in the Obsidian vault. Use to inspect a "
        "note before editing or to answer questions about its contents."
    ),
    parameters={
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "Vault-relative path to the file, e.g. 'Daily/2026-06-01.md'.",
            },
            "max_bytes": {
                "type": "integer",
                "description": "Optional cap on bytes returned for large files. Omit to read the whole file.",
            },
        },
        "required": ["path"],
        "additionalProperties": False,
    },
    returns=(
        "{ path: string, content: string, size_bytes: integer, truncated: boolean, "
        "modified_at: string (ISO 8601 UTC) }"
    ),
    executor=execute,
)
