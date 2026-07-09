# stack_sandbox/backend/src/llm/tools/native/obsidian/vault_delete_file.py
"""Obsidian tool: delete a single file from the vault."""

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import OBSIDIAN
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.obsidian._vault import resolve_vault_path, to_vault_relative


async def execute(arguments: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    """Delete a single file from the vault. Only use when the user clearly requested deletion. Fails if the path is missing or is a directory (this tool does not delete folders)."""
    path = resolve_vault_path(arguments.get("path"))
    if not path.exists():
        raise AppError(f"File not found: {to_vault_relative(path)}", status_code=404)
    if path.is_dir():
        raise AppError(
            f"Path is a directory, not a file: {to_vault_relative(path)}",
            status_code=400,
        )
    relative = to_vault_relative(path)
    path.unlink()
    return {"path": relative, "deleted": True}


TOOL_DEFINITION = ToolDefinition(
    name="vault_delete_file",
    category=OBSIDIAN,
    description=(
        "Delete a single file from the vault. Only use when the user clearly requested "
        "deletion. Fails if the path is missing or is a directory (this tool does not "
        "delete folders)."
    ),
    parameters={
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "Vault-relative path of the file to delete.",
            },
        },
        "required": ["path"],
        "additionalProperties": False,
    },
    returns="{ path: string, deleted: true }",
    executor=execute,
)
