# stack_sandbox/backend/src/llm/orchestrator/events.py
"""Normalized events emitted by the orchestrator.

Most map directly to SSE frames sent to the client. `COMPLETED` is internal: the
chat service consumes it to persist the assistant message and then emits the
public `assistant_message` / `done` frames.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


class EventName:
    USER_MESSAGE = "user_message"
    AGENT_SELECTED = "agent_selected"
    DELTA = "delta"
    TOOL_CALL_START = "tool_call_start"
    TOOL_CALL_RESULT = "tool_call_result"
    ASSISTANT_MESSAGE = "assistant_message"
    DONE = "done"
    ERROR = "error"

    # Internal — not forwarded to the client as-is.
    COMPLETED = "_completed"


@dataclass
class OrchestratorEvent:
    """One orchestrator output: an event name plus a JSON-serializable payload."""

    name: str
    data: dict[str, Any]
