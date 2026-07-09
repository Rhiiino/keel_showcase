# stack_sandbox/backend/src/llm/providers/anthropic_provider.py
"""Anthropic streaming provider — stub.

Scaffolded so the factory and orchestrator can target Anthropic without further
wiring. Implement the Messages streaming API here when Anthropic goes live.
"""

from __future__ import annotations

from typing import Any, AsyncIterator

from core.errors import AppError
from llm.providers.base import ChatTurn, StreamEvent


class AnthropicProvider:
    name = "anthropic"

    def __init__(self, *, api_key: str, model: str) -> None:
        """Hold Anthropic API credentials and default model (stub)."""
        self._api_key = api_key
        self._model = model

    async def stream(
        self,
        *,
        model: str,
        system_prompt: str,
        history: list[ChatTurn],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncIterator[StreamEvent]:
        """Placeholder stream reporting Anthropic is not implemented."""
        raise AppError("Anthropic provider is not implemented yet.", status_code=501)
        yield  # pragma: no cover - marks this as an async generator
