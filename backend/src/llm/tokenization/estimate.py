# stack_sandbox/backend/src/llm/tokenization/estimate.py

"""Token counting helpers for system prompts and tool manifests."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from llm.orchestrator.delegation import DELEGATE_TOOL_NAME
from llm.tokenization.encodings import resolve_encoding
from llm.tools.registry import TOOL_CATEGORY_MAP


@dataclass(frozen=True)
class ToolTokenEstimate:
    """Per-tool token estimate for one manifest entry."""

    name: str
    category: str
    tokens: int


def count_text_tokens(text: str, provider: str, model_id: str) -> tuple[int, bool]:
    """Count tokens in plain text. Returns (count, is_estimate)."""
    encoding, is_estimate = resolve_encoding(provider, model_id)
    if not text:
        return 0, is_estimate
    return len(encoding.encode(text)), is_estimate


def count_tools_tokens(
    tools: list[dict[str, Any]],
    provider: str,
    model_id: str,
) -> tuple[int, bool]:
    """Count tokens for a compact JSON tools array as sent to the provider."""
    if not tools:
        return 0, False

    encoding, is_estimate = resolve_encoding(provider, model_id)
    payload = json.dumps(tools, separators=(",", ":"), ensure_ascii=False)
    return len(encoding.encode(payload)), is_estimate


def _tool_category_from_manifest(tool: dict[str, Any]) -> str:
    """Resolve display category for a manifest entry."""
    function = tool.get("function") or {}
    name = function.get("name")
    if name == DELEGATE_TOOL_NAME:
        return "delegate"
    if isinstance(name, str) and name in TOOL_CATEGORY_MAP:
        return TOOL_CATEGORY_MAP[name]
    return "unknown"


def count_tool_token_breakdown(
    tools: list[dict[str, Any]],
    provider: str,
    model_id: str,
) -> tuple[list[ToolTokenEstimate], bool]:
    """Estimate tokens for each tool schema individually."""
    if not tools:
        return [], False

    is_estimate = False
    breakdown: list[ToolTokenEstimate] = []
    for tool in tools:
        tokens, tool_estimate = count_tools_tokens([tool], provider, model_id)
        is_estimate = is_estimate or tool_estimate
        function = tool.get("function") or {}
        name = function.get("name")
        if not isinstance(name, str) or not name:
            continue
        breakdown.append(
            ToolTokenEstimate(
                name=name,
                category=_tool_category_from_manifest(tool),
                tokens=tokens,
            )
        )

    breakdown.sort(key=lambda entry: (entry.category, entry.name))
    return breakdown, is_estimate


def count_context_usage(
    *,
    system_prompt: str,
    tools: list[dict[str, Any]],
    provider: str,
    model_id: str,
) -> tuple[int, int, bool]:
    """Return (system_prompt_tokens, tools_tokens, is_estimate)."""
    system_tokens, system_estimate = count_text_tokens(system_prompt, provider, model_id)
    tools_tokens, tools_estimate = count_tools_tokens(tools, provider, model_id)
    return system_tokens, tools_tokens, system_estimate or tools_estimate
