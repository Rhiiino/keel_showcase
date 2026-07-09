# stack_sandbox/backend/src/llm/tools/native/web/web_crawl.py
"""Tavily-backed multi-page site crawl."""

from __future__ import annotations

from typing import Any

from llm.tools.categories import WEB
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.web import _tavily


async def execute(arguments: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    """Crawl a site and extract content from multiple pages via Tavily."""
    url = arguments.get("url")
    if url is None or not str(url).strip():
        return {"error": "url is required"}

    max_depth = _tavily.clamp_int(
        arguments.get("max_depth"),
        default=_tavily.CRAWL_MAX_DEPTH_DEFAULT,
        minimum=1,
        maximum=_tavily.CRAWL_MAX_DEPTH_MAX,
    )
    limit = _tavily.clamp_int(
        arguments.get("limit"),
        default=_tavily.CRAWL_LIMIT_DEFAULT,
        minimum=1,
        maximum=_tavily.CRAWL_LIMIT_MAX,
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
            "extract_depth": _tavily.CRAWL_EXTRACT_DEPTH,
            "format": _tavily.CRAWL_FORMAT,
            "allow_external": False,
            "timeout": _tavily.CRAWL_TIMEOUT,
            "include_usage": _tavily.CRAWL_INCLUDE_USAGE,
        }
        if instructions_str:
            call_kw["instructions"] = instructions_str
        return _tavily.to_dict(client.crawl(**call_kw))

    return await _tavily.run_tavily(_call)


TOOL_DEFINITION = ToolDefinition(
    name="web_crawl",
    category=WEB,
    description=(
        "Crawl multiple pages on a site via Tavily and return extracted content. "
        "Credit-heavy — prefer web_search then web_extract for one-off questions. "
        "Use only when the user explicitly needs many pages from one site."
    ),
    parameters={
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "Root URL to start crawling from.",
            },
            "instructions": {
                "type": "string",
                "description": "Optional natural-language guidance for which pages to follow.",
            },
            "max_depth": {
                "type": "integer",
                "description": "Maximum link depth from the root (server-clamped, default 1).",
            },
            "limit": {
                "type": "integer",
                "description": "Maximum pages to crawl (server-clamped, default 30).",
            },
        },
        "required": ["url"],
        "additionalProperties": False,
    },
    returns="{ base_url, results: [{ url, raw_content }], response_time?, usage? }",
    executor=execute,
)
