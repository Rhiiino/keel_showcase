# stack_sandbox/backend/src/llm/providers/base.py
"""Stream-first LLM provider protocol and shared event types.

Providers normalize their wire format into a small set of events so the
orchestrator stays provider-agnostic.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, AsyncIterator, Protocol, Union, runtime_checkable


@dataclass
class ChatTurn:
    """One message in the model-facing history."""

    role: str  # "system" | "user" | "assistant" | "tool"
    content: str


@dataclass
class StreamDelta:
    """A chunk of streamed assistant text."""

    content: str


@dataclass
class StreamDone:
    """Terminal event for one provider stream round."""

    finish_reason: str
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    usage: dict[str, Any] | None = None


StreamEvent = Union[StreamDelta, StreamDone]


@runtime_checkable
class LLMStreamProvider(Protocol):
    """Each provider yields a sequence of `StreamDelta` ending in one `StreamDone`."""

    name: str

    def stream(
        self,
        *,
        model: str,
        system_prompt: str,
        history: list[ChatTurn],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncIterator[StreamEvent]:
        """Yield normalized stream events for one chat completion turn."""
        ...
