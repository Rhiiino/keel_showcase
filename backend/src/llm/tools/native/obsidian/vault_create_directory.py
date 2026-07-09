# stack_sandbox/backend/src/llm/tools/native/obsidian/vault_create_directory.py
"""Obsidian tool: create a directory (and parents) within the vault."""

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import OBSIDIAN
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.obsidian._vault import resolve_vault_path, to_vault_relative


async def execute(arguments: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    """Create a folder (and any missing parent folders) in the vault. Idempotent — succeeds whether or not the folder already existed. Note: writing a file already creates its parent folders, so this is only needed for empty folders."""
    path = resolve_vault_path(arguments.get("path"))
    if path.exists() and not path.is_dir():
        raise AppError(
            f"Path exists and is a file, not a directory: {to_vault_relative(path)}",
            status_code=400,
        )
    created = not path.exists()
    path.mkdir(parents=True, exist_ok=True)
    return {"path": to_vault_relative(path), "created": created}


TOOL_DEFINITION = ToolDefinition(
    name="vault_create_directory",
    category=OBSIDIAN,
    description=(
        "Create a folder (and any missing parent folders) in the vault. Idempotent — "
        "succeeds whether or not the folder already existed. Note: writing a file "
        "already creates its parent folders, so this is only needed for empty folders."
    ),
    parameters={
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "Vault-relative folder path to create, e.g. 'Projects/Keel'.",
            },
        },
        "required": ["path"],
        "additionalProperties": False,
    },
    returns="{ path: string, created: boolean }  (created=false if it already existed)",
    executor=execute,
)
