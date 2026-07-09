# stack_sandbox/backend/src/llm/providers/moonshot_provider.py
"""Moonshot (Kimi) streaming provider — OpenAI-compatible Chat Completions API."""

from __future__ import annotations

from typing import Any, AsyncIterator

from llm.providers.base import ChatTurn, StreamEvent
from llm.providers.openai_provider import OpenAIProvider

# International platform (platform.moonshot.ai). China keys use https://api.moonshot.cn/v1.
DEFAULT_MOONSHOT_BASE_URL = "https://api.moonshot.ai/v1"


class MoonshotProvider:
    """Streaming provider for Moonshot's OpenAI-compatible `/v1/chat/completions` API."""

    name = "moonshot"

    def __init__(
        self,
        *,
        api_key: str,
        base_url: str = DEFAULT_MOONSHOT_BASE_URL,
    ) -> None:
        """Delegate to an OpenAI-compatible client using Moonshot endpoints."""
        self._delegate = OpenAIProvider(
            api_key=api_key,
            base_url=base_url,
            name=self.name,
        )

    async def stream(
        self,
        *,
        model: str,
        system_prompt: str,
        history: list[ChatTurn],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncIterator[StreamEvent]:
        """Forward streaming chat completion events from the delegate."""
        async for event in self._delegate.stream(
            model=model,
            system_prompt=system_prompt,
            history=history,
            tools=tools,
        ):
            yield event
