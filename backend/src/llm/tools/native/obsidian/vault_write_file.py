# stack_sandbox/backend/src/llm/tools/native/obsidian/vault_write_file.py
"""Obsidian tool: create or overwrite a file with the given content."""

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import OBSIDIAN
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.obsidian._vault import (
    resolve_vault_path,
    to_vault_relative,
    write_text,
)


async def execute(arguments: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    """Create a new file or overwrite an existing one with the provided content. Parent folders are created automatically. By default fails if the file already exists; pass overwrite=true to replace it. Prefer vault_patch_file or vault_append_file for edits that should preserve existing content."""
    path = resolve_vault_path(arguments.get("path"))
    content = arguments.get("content")
    if not isinstance(content, str):
        raise AppError("'content' (string) is required.", status_code=400)
    overwrite = bool(arguments.get("overwrite", False))

    existed = path.exists()
    if existed and not overwrite:
        raise AppError(
            f"File already exists: {to_vault_relative(path)}. Set overwrite=true to replace it.",
            status_code=409,
        )
    if existed and path.is_dir():
        raise AppError(f"Path is a directory: {to_vault_relative(path)}", status_code=400)

    size_bytes = write_text(path, content)
    return {"path": to_vault_relative(path), "created": not existed, "size_bytes": size_bytes}


TOOL_DEFINITION = ToolDefinition(
    name="vault_write_file",
    category=OBSIDIAN,
    description=(
        "Create a new file or overwrite an existing one with the provided content. "
        "Parent folders are created automatically. By default fails if the file "
        "already exists; pass overwrite=true to replace it. Prefer vault_patch_file or "
        "vault_append_file for edits that should preserve existing content."
    ),
    parameters={
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "Vault-relative path to write, e.g. 'Inbox/Idea.md'.",
            },
            "content": {
                "type": "string",
                "description": "Full UTF-8 text content to write.",
            },
            "overwrite": {
                "type": "boolean",
                "description": "Replace the file if it already exists. Default false.",
                "default": False,
            },
        },
        "required": ["path", "content"],
        "additionalProperties": False,
    },
    returns="{ path: string, created: boolean, size_bytes: integer }",
    executor=execute,
)
