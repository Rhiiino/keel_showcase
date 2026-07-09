# stack_sandbox/backend/src/llm/providers/openai_provider.py
"""OpenAI Chat Completions streaming provider.

Streams an OpenAI-compatible Chat Completions request and normalizes the
server-sent chunks into `StreamDelta` / `StreamDone` events. The same wire
format is used by other OpenAI-compatible APIs (e.g. Moonshot), so this class
takes a base URL and key and can be reused later.
"""

from __future__ import annotations

import json
import logging
from typing import Any, AsyncIterator

import httpx

from core.errors import AppError
from llm.providers.base import ChatTurn, StreamDelta, StreamDone, StreamEvent

logger = logging.getLogger(__name__)

_REQUEST_TIMEOUT_SECONDS = 60.0


class OpenAIProvider:
    """Streaming provider for the OpenAI Chat Completions API."""

    def __init__(
        self,
        *,
        api_key: str,
        base_url: str = "https://api.openai.com/v1",
        name: str = "openai",
    ) -> None:
        """Store API credentials and base URL for chat completions."""
        self.name = name
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")

    def _build_messages(
        self,
        *,
        system_prompt: str,
        history: list[ChatTurn],
    ) -> list[dict[str, str]]:
        """Map system prompt and history into OpenAI message objects."""
        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        for turn in history:
            messages.append({"role": turn.role, "content": turn.content})
        return messages

    async def stream(
        self,
        *,
        model: str,
        system_prompt: str,
        history: list[ChatTurn],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncIterator[StreamEvent]:
        """Stream chat completions and yield delta and done events."""
        if not self._api_key:
            raise AppError(
                f"{self.name} API key is not configured.", status_code=503
            )

        body: dict[str, Any] = {
            "model": model,
            "messages": self._build_messages(
                system_prompt=system_prompt, history=history
            ),
            "stream": True,
            "stream_options": {"include_usage": True},
        }
        if tools:
            body["tools"] = tools

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        url = f"{self._base_url}/chat/completions"

        tool_calls_accum: dict[int, dict[str, Any]] = {}
        finish_reason = "stop"
        usage: dict[str, Any] | None = None

        try:
            async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT_SECONDS) as client:
                async with client.stream(
                    "POST", url, headers=headers, json=body
                ) as response:
                    if response.status_code >= 400:
                        detail = (await response.aread()).decode("utf-8", "replace")
                        logger.warning(
                            "%s stream error %s: %s",
                            self.name,
                            response.status_code,
                            detail,
                        )
                        raise AppError(
                            f"{self.name} request failed ({response.status_code}).",
                            status_code=502,
                        )

                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data:"):
                            continue
                        payload = line[len("data:") :].strip()
                        if payload == "[DONE]":
                            break

                        try:
                            chunk = json.loads(payload)
                        except json.JSONDecodeError:
                            continue

                        chunk_usage = chunk.get("usage")
                        if chunk_usage:
                            usage = chunk_usage

                        choices = chunk.get("choices") or []
                        if not choices:
                            continue

                        choice = choices[0]
                        delta = choice.get("delta") or {}

                        content = delta.get("content")
                        if content:
                            yield StreamDelta(content=content)

                        delta_tool_calls = delta.get("tool_calls")
                        if isinstance(delta_tool_calls, list):
                            _merge_tool_call_deltas(tool_calls_accum, delta_tool_calls)

                        if choice.get("finish_reason"):
                            finish_reason = choice["finish_reason"]
        except httpx.HTTPError as exc:
            logger.exception("%s stream transport error", self.name)
            raise AppError(
                f"{self.name} request failed: {exc}", status_code=502
            ) from exc

        tool_calls = [tool_calls_accum[i] for i in sorted(tool_calls_accum)]
        yield StreamDone(
            finish_reason=finish_reason, tool_calls=tool_calls, usage=usage
        )


def _merge_tool_call_deltas(
    accumulator: dict[int, dict[str, Any]],
    deltas: list[dict[str, Any]],
) -> None:
    """Merge streamed tool-call fragments (keyed by index) into full tool calls."""
    for delta in deltas:
        index = delta.get("index", 0)
        entry = accumulator.setdefault(
            index,
            {"id": None, "type": "function", "function": {"name": "", "arguments": ""}},
        )
        if delta.get("id"):
            entry["id"] = delta["id"]
        if delta.get("type"):
            entry["type"] = delta["type"]
        function = delta.get("function") or {}
        if function.get("name"):
            entry["function"]["name"] = function["name"]
        if function.get("arguments"):
            entry["function"]["arguments"] += function["arguments"]
