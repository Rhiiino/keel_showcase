# stack_sandbox/backend/src/llm/sse.py
"""Server-Sent Events formatting helper shared by streaming endpoints."""

from __future__ import annotations

import json
from typing import Any


def sse_event(event: str, data: dict[str, Any] | str) -> str:
    """Format a named SSE frame.

    Produces ``event: <name>\\ndata: <json>\\n\\n``. Dict payloads are JSON-encoded
    with a string fallback so values like datetimes never break the stream.
    """
    payload = data if isinstance(data, str) else json.dumps(data, default=str)
    return f"event: {event}\ndata: {payload}\n\n"
