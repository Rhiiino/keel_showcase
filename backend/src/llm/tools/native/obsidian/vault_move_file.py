# stack_sandbox/backend/src/llm/tools/native/obsidian/vault_move_file.py
"""Obsidian tool: move or rename a file within the vault."""

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import OBSIDIAN
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.obsidian._vault import resolve_vault_path, to_vault_relative


async def execute(arguments: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    """Move or rename a file within the vault. Parent folders of the destination are created automatically. Fails if the destination exists unless overwrite=true."""
    source = resolve_vault_path(arguments.get("from_path"))
    target = resolve_vault_path(arguments.get("to_path"))
    overwrite = bool(arguments.get("overwrite", False))

    if not source.exists():
        raise AppError(f"Source not found: {to_vault_relative(source)}", status_code=404)
    if source.is_dir():
        raise AppError(
            f"Source is a directory: {to_vault_relative(source)}", status_code=400
        )
    if target.exists():
        if target.is_dir():
            raise AppError(
                f"Target is a directory: {to_vault_relative(target)}", status_code=400
            )
        if not overwrite:
            raise AppError(
                f"Target already exists: {to_vault_relative(target)}. Set overwrite=true to replace it.",
                status_code=409,
            )

    target.parent.mkdir(parents=True, exist_ok=True)
    from_relative = to_vault_relative(source)
    source.replace(target)
    return {"from_path": from_relative, "to_path": to_vault_relative(target)}


TOOL_DEFINITION = ToolDefinition(
    name="vault_move_file",
    category=OBSIDIAN,
    description=(
        "Move or rename a file within the vault. Parent folders of the destination are "
        "created automatically. Fails if the destination exists unless overwrite=true."
    ),
    parameters={
        "type": "object",
        "properties": {
            "from_path": {
                "type": "string",
                "description": "Current vault-relative path of the file.",
            },
            "to_path": {
                "type": "string",
                "description": "New vault-relative path (including filename).",
            },
            "overwrite": {
                "type": "boolean",
                "description": "Replace the destination if it already exists. Default false.",
                "default": False,
            },
        },
        "required": ["from_path", "to_path"],
        "additionalProperties": False,
    },
    returns="{ from_path: string, to_path: string }",
    executor=execute,
)
