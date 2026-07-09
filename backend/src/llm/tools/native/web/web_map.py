# stack_sandbox/backend/src/llm/tools/native/web/web_map.py
"""Tavily-backed site structure discovery."""

from __future__ import annotations

from typing import Any

from llm.tools.categories import WEB
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.web import _tavily


async def execute(arguments: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    """Map a website's URL structure via Tavily."""
    url = arguments.get("url")
    if url is None or not str(url).strip():
        return {"error": "url is required"}

    max_depth = _tavily.clamp_int(
        arguments.get("max_depth"),
        default=_tavily.MAP_MAX_DEPTH_DEFAULT,
        minimum=1,
        maximum=_tavily.MAP_MAX_DEPTH_MAX,
    )
    limit = _tavily.clamp_int(
        arguments.get("limit"),
        default=_tavily.MAP_LIMIT_DEFAULT,
        minimum=1,
        maximum=_tavily.MAP_LIMIT_MAX,
    )
    instructions = arguments.get("instructions")
    instructions_str = (
        str(instructions).strip() if instructions is not None else None
    )

    def _call() -> dict[str, Any]:
        client = _tavily.get_client()
        call_kw: dict[str, Any] = {
            "url": str(url).strip(),
            "max_depth": max_depth,
            "limit": limit,
            "timeout": _tavily.MAP_TIMEOUT,
            "include_usage": True,
        }
        if instructions_str:
            call_kw["instructions"] = instructions_str
        return _tavily.to_dict(client.map(**call_kw))

    return await _tavily.run_tavily(_call)


TOOL_DEFINITION = ToolDefinition(
    name="web_map",
    category=WEB,
    description=(
        "Discover URLs on a website via Tavily before crawling or targeted extraction. "
        "Use when you need to see what pages exist under a domain or docs site."
    ),
    parameters={
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "Root site URL to map (e.g. https://docs.example.com).",
            },
            "instructions": {
                "type": "string",
                "description": "Optional natural-language filter for which pages to include.",
            },
            "max_depth": {
                "type": "integer",
                "description": "Link depth from the root URL (server-clamped, default 1).",
            },
            "limit": {
                "type": "integer",
                "description": "Maximum URLs to return (server-clamped, default 50).",
            },
        },
        "required": ["url"],
        "additionalProperties": False,
    },
    returns="{ base_url, results: [url strings or objects], response_time?, usage? }",
    executor=execute,
)
