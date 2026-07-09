# stack_sandbox/backend/src/llm/tools/native/web/web_extract.py
"""Tavily-backed page content extraction."""

from __future__ import annotations

from typing import Any

from llm.tools.categories import WEB
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.web import _tavily


async def execute(arguments: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    """Extract LLM-ready content from one or more URLs via Tavily."""
    urls = _tavily.normalize_urls(arguments.get("urls"))
    if not urls:
        return {"error": "urls is required (string or non-empty array)"}

    extract_format = arguments.get("format", "markdown")
    if extract_format not in {"markdown", "text"}:
        extract_format = "markdown"

    rerank_query = arguments.get("query")
    rerank_query_str = str(rerank_query).strip() if rerank_query is not None else None

    def _call() -> dict[str, Any]:
        client = _tavily.get_client()
        call_kw: dict[str, Any] = {
            "urls": urls,
            "extract_depth": _tavily.EXTRACT_DEPTH,
            "format": extract_format,
            "include_usage": _tavily.EXTRACT_INCLUDE_USAGE,
        }
        if rerank_query_str:
            call_kw["query"] = rerank_query_str
        return _tavily.to_dict(client.extract(**call_kw))

    return await _tavily.run_tavily(_call)


TOOL_DEFINITION = ToolDefinition(
    name="web_extract",
    category=WEB,
    description=(
        "Extract clean page content from known URLs via Tavily. Use after web_search when you "
        "need full text from specific links, or when the user supplies URLs directly."
    ),
    parameters={
        "type": "object",
        "properties": {
            "urls": {
                "oneOf": [
                    {"type": "string", "description": "Single URL to extract."},
                    {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "URLs to extract (server clamps count).",
                    },
                ],
                "description": "One URL or a list of URLs.",
            },
            "query": {
                "type": "string",
                "description": "Optional intent string to rerank extracted chunks for relevance.",
            },
            "format": {
                "type": "string",
                "enum": ["markdown", "text"],
                "description": "Output format (default markdown).",
            },
        },
        "required": ["urls"],
        "additionalProperties": False,
    },
    returns="{ results: [{ url, raw_content, favicon? }], failed_results?, response_time?, usage? }",
    executor=execute,
)
