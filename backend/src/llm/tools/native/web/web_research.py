# stack_sandbox/backend/src/llm/tools/native/web/web_research.py
"""Tavily-backed multi-source cited research."""

from __future__ import annotations

from typing import Any

from llm.tools.categories import WEB
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.web import _tavily


async def execute(arguments: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    """Run a Tavily research task and return a cited report."""
    query = arguments.get("query") or arguments.get("input")
    if query is None or not str(query).strip():
        return {"error": "query is required"}

    def _call() -> dict[str, Any]:
        client = _tavily.get_client()
        initial = _tavily.to_dict(
            client.research(
                input=str(query).strip(),
                model=_tavily.RESEARCH_MODEL,
                output_length=_tavily.RESEARCH_OUTPUT_LENGTH,
                stream=False,
                timeout=_tavily.RESEARCH_TIMEOUT_SECONDS,
            )
        )
        status = initial.get("status")
        if status == "completed":
            return initial
        request_id = initial.get("request_id")
        if not request_id:
            return initial
        if status in {"pending", "in_progress"}:
            return _tavily.poll_research(client, str(request_id))
        return initial

    return await _tavily.run_tavily(_call)


TOOL_DEFINITION = ToolDefinition(
    name="web_research",
    category=WEB,
    description=(
        "Run multi-step cited web research via Tavily and return a synthesized report with sources. "
        "Highest latency and credit cost in the web toolkit — use web_search for simple lookups. "
        "Use when the user wants a comparison, market overview, or detailed cited summary."
    ),
    parameters={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Research question or topic to investigate across multiple web sources.",
            },
        },
        "required": ["query"],
        "additionalProperties": False,
    },
    returns="{ status, content, sources: [{ title, url, favicon? }], request_id?, response_time? }",
    executor=execute,
)
