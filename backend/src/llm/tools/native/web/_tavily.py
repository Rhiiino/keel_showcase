# stack_sandbox/backend/src/llm/tools/native/web/_tavily.py
"""Shared Tavily client helpers for web category tools."""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Callable

from core.config import get_settings

logger = logging.getLogger(__name__)

SEARCH_DEPTH = "basic"
SEARCH_INCLUDE_ANSWER = True
SEARCH_INCLUDE_USAGE = True
SEARCH_MAX_RESULTS_MIN = 3
SEARCH_MAX_RESULTS_MAX = 8
SEARCH_MAX_RESULTS_DEFAULT = 5

EXTRACT_DEPTH = "basic"
EXTRACT_MAX_URLS = 10
EXTRACT_INCLUDE_USAGE = True

MAP_MAX_DEPTH_DEFAULT = 1
MAP_MAX_DEPTH_MAX = 2
MAP_LIMIT_DEFAULT = 50
MAP_LIMIT_MAX = 100
MAP_TIMEOUT = 150.0

CRAWL_MAX_DEPTH_DEFAULT = 1
CRAWL_MAX_DEPTH_MAX = 2
CRAWL_LIMIT_DEFAULT = 30
CRAWL_LIMIT_MAX = 50
CRAWL_EXTRACT_DEPTH = "basic"
CRAWL_FORMAT = "markdown"
CRAWL_TIMEOUT = 150.0
CRAWL_INCLUDE_USAGE = True

RESEARCH_MODEL = "mini"
RESEARCH_OUTPUT_LENGTH = "standard"
RESEARCH_TIMEOUT_SECONDS = 180.0
RESEARCH_POLL_INTERVAL_SECONDS = 2.0

_TOPICS = frozenset({"general", "news", "finance"})
_TIME_RANGES = frozenset({"day", "week", "month", "year", "d", "w", "m", "y"})


def missing_key_response() -> dict[str, Any]:
    """Return a structured error when Tavily is not configured."""
    return {"error": "Web tools are not configured (missing TAVILY_API_KEY)."}


def api_key_configured() -> bool:
    """True when TAVILY_API_KEY is set."""
    return bool(get_settings().tavily_api_key.strip())


def get_client() -> Any:
    """Build a Tavily SDK client using application settings."""
    from tavily import TavilyClient

    return TavilyClient(api_key=get_settings().tavily_api_key.strip())


def to_dict(result: Any) -> dict[str, Any]:
    """Normalize Tavily SDK responses to plain dicts."""
    if hasattr(result, "model_dump"):
        return result.model_dump()
    if isinstance(result, dict):
        return result
    return {"result": result}


async def run_tavily(call: Callable[[], dict[str, Any]]) -> dict[str, Any]:
    """Run a sync Tavily SDK call on a worker thread."""
    if not api_key_configured():
        return missing_key_response()
    try:
        return await asyncio.to_thread(call)
    except Exception as exc:
        logger.exception("Tavily call failed")
        return {"error": str(exc)}


def clamp_int(
    raw: Any,
    *,
    default: int,
    minimum: int,
    maximum: int,
) -> int:
    """Parse and clamp an integer tool argument."""
    if raw is None:
        return default
    try:
        value = int(raw)
    except (TypeError, ValueError):
        return default
    return max(minimum, min(maximum, value))


def normalize_topic(raw: Any) -> str:
    """Normalize Tavily search topic."""
    if raw is None:
        return "general"
    topic = str(raw).strip().lower()
    return topic if topic in _TOPICS else "general"


def normalize_time_range(raw: Any) -> str | None:
    """Normalize Tavily search time_range; None when invalid or omitted."""
    if raw is None:
        return None
    time_range = str(raw).strip().lower()
    return time_range if time_range in _TIME_RANGES else None


def normalize_urls(raw: Any) -> list[str]:
    """Normalize urls argument to a non-empty list (max EXTRACT_MAX_URLS)."""
    if isinstance(raw, str) and raw.strip():
        urls = [raw.strip()]
    elif isinstance(raw, list):
        urls = [str(item).strip() for item in raw if str(item).strip()]
    else:
        return []
    return urls[:EXTRACT_MAX_URLS]


def poll_research(client: Any, request_id: str) -> dict[str, Any]:
    """Poll Tavily research status until completed, failed, or timeout."""
    deadline = time.monotonic() + RESEARCH_TIMEOUT_SECONDS
    while time.monotonic() < deadline:
        payload = to_dict(client.get_research(request_id))
        status = payload.get("status")
        if status == "completed":
            return payload
        if status == "failed":
            return {"error": "Tavily research task failed.", **payload}
        time.sleep(RESEARCH_POLL_INTERVAL_SECONDS)
    return {
        "error": f"Tavily research timed out after {int(RESEARCH_TIMEOUT_SECONDS)}s.",
        "request_id": request_id,
    }
