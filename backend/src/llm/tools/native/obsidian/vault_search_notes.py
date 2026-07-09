# stack_sandbox/backend/src/llm/tools/native/obsidian/vault_search_notes.py
"""Obsidian tool: case-insensitive substring search across markdown notes."""

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import OBSIDIAN
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.obsidian._vault import resolve_vault_path, to_vault_relative

_SNIPPETS_PER_FILE = 3
_SNIPPET_RADIUS = 60


def _snippets(text: str, needle_lower: str) -> list[str]:
    """Extract short context snippets around a search match."""
    out: list[str] = []
    haystack_lower = text.lower()
    start = 0
    while len(out) < _SNIPPETS_PER_FILE:
        idx = haystack_lower.find(needle_lower, start)
        if idx == -1:
            break
        begin = max(0, idx - _SNIPPET_RADIUS)
        end = min(len(text), idx + len(needle_lower) + _SNIPPET_RADIUS)
        snippet = text[begin:end].replace("\n", " ").strip()
        out.append(("…" if begin > 0 else "") + snippet + ("…" if end < len(text) else ""))
        start = idx + len(needle_lower)
    return out


async def execute(arguments: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    """Case-insensitive substring search across markdown (.md) notes in the vault. Use to find where something is written when the exact file is unknown."""
    query = (arguments.get("query") or "").strip()
    if not query:
        raise AppError("A non-empty 'query' is required.", status_code=400)
    needle_lower = query.lower()

    max_results = arguments.get("max_results")
    max_results = max_results if isinstance(max_results, int) and max_results > 0 else 20

    search_root = resolve_vault_path(arguments.get("path_prefix") or "")

    hits: list[dict[str, Any]] = []
    for current in sorted(search_root.rglob("*.md")):
        if ".obsidian" in current.relative_to(search_root).parts:
            continue
        try:
            text = current.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if needle_lower not in text.lower():
            continue
        hits.append({"path": to_vault_relative(current), "snippets": _snippets(text, needle_lower)})
        if len(hits) >= max_results:
            break

    return {"query": query, "hits": hits, "total": len(hits)}


TOOL_DEFINITION = ToolDefinition(
    name="vault_search_notes",
    category=OBSIDIAN,
    description=(
        "Case-insensitive substring search across markdown (.md) notes in the vault. "
        "Use to find where something is written when the exact file is unknown."
    ),
    parameters={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Text to search for (case-insensitive substring match).",
            },
            "path_prefix": {
                "type": "string",
                "description": "Optional vault-relative folder to limit the search to. Omit to search the whole vault.",
            },
            "max_results": {
                "type": "integer",
                "description": "Maximum number of matching files to return. Default 20.",
                "default": 20,
            },
        },
        "required": ["query"],
        "additionalProperties": False,
    },
    returns=(
        "{ query: string, hits: [{ path: string, snippets: [string] }], total: integer } "
        "— up to 3 context snippets per file."
    ),
    executor=execute,
)
