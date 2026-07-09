# stack_sandbox/backend/src/llm/tools/native/web/web_search.py
"""Tavily-backed public web search."""

from __future__ import annotations

from typing import Any

from llm.tools.categories import WEB
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.web import _tavily


async def execute(arguments: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    """Search the public web via Tavily."""
    query = arguments.get("query")
    if query is None or not str(query).strip():
        return {"error": "query is required"}

    max_results = _tavily.clamp_int(
        arguments.get("max_results"),
        default=_tavily.SEARCH_MAX_RESULTS_DEFAULT,
        minimum=_tavily.SEARCH_MAX_RESULTS_MIN,
        maximum=_tavily.SEARCH_MAX_RESULTS_MAX,
    )
    topic = _tavily.normalize_topic(arguments.get("topic"))
    time_range = _tavily.normalize_time_range(arguments.get("time_range"))

    def _call() -> dict[str, Any]:
        client = _tavily.get_client()
        call_kw: dict[str, Any] = {
            "query": str(query).strip(),
            "topic": topic,
            "search_depth": _tavily.SEARCH_DEPTH,
            "max_results": max_results,
            "include_answer": _tavily.SEARCH_INCLUDE_ANSWER,
            "include_usage": _tavily.SEARCH_INCLUDE_USAGE,
        }
        if time_range is not None:
            call_kw["time_range"] = time_range
        return _tavily.to_dict(client.search(**call_kw))

    return await _tavily.run_tavily(_call)


TOOL_DEFINITION = ToolDefinition(
    name="web_search",
    category=WEB,
    description=(
        "Search the public web via Tavily for current or factual information (news, products, "
        "documentation, sports, etc.). The response may include an `answer` field synthesized by "
        "Tavily — treat it as a hint only; always read `results` (titles, URLs, snippets) and "
        "synthesize or verify before answering the user. Cite source URLs when appropriate."
    ),
    parameters={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Focused search query (keywords, entities, dates) — not the full chat transcript.",
            },
            "topic": {
                "type": "string",
                "enum": ["general", "news", "finance"],
                "description": "Search category. Defaults to general if omitted.",
            },
            "time_range": {
                "type": "string",
                "enum": ["day", "week", "month", "year"],
                "description": "Recency filter. Omit if not needed.",
            },
            "max_results": {
                "type": "integer",
                "description": "How many result rows to return; server clamps between 3 and 8 (default 5).",
            },
        },
        "required": ["query"],
        "additionalProperties": False,
    },
    returns="{ query, answer?, results: [{ title, url, content, score? }], response_time?, usage? }",
    executor=execute,
)
