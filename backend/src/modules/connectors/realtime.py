# keel_api/src/modules/connectors/realtime.py

"""In-memory SSE broadcaster for connector automation events."""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from threading import Lock
from typing import Any

from modules.connectors.schemas import ConnectorActorPublic, ConnectorAutomationEventPublic


_subscribers: dict[tuple[int, str], set[asyncio.Queue[ConnectorAutomationEventPublic]]] = {}
_lock = Lock()


def _format_sse(event: ConnectorAutomationEventPublic) -> str:
    payload = event.model_dump(mode="json", exclude_none=True)
    event_name = payload.pop("event", "message")
    data = json.dumps(payload, separators=(",", ":"))
    return f"event: {event_name}\ndata: {data}\n\n"


def _heartbeat() -> str:
    return ": heartbeat\n\n"


async def subscribe_connector_events(
    *,
    user_id: int,
    connector: str,
) -> AsyncIterator[str]:
    queue: asyncio.Queue[ConnectorAutomationEventPublic] = asyncio.Queue()
    key = (user_id, connector)
    with _lock:
        _subscribers.setdefault(key, set()).add(queue)
    try:
        yield _heartbeat()
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=20.0)
                yield _format_sse(event)
            except TimeoutError:
                yield _heartbeat()
    finally:
        with _lock:
            subscribers = _subscribers.get(key)
            if subscribers is not None:
                subscribers.discard(queue)
                if not subscribers:
                    _subscribers.pop(key, None)


def publish_connector_event(
    *,
    user_id: int,
    connector: str,
    event: ConnectorAutomationEventPublic,
) -> None:
    key = (user_id, connector)
    with _lock:
        queues = list(_subscribers.get(key, set()))
    for queue in queues:
        try:
            queue.put_nowait(event)
        except asyncio.QueueFull:
            continue


def build_actor(*, actor_label: str, actor_type: str = "external_connector") -> ConnectorActorPublic:
    return ConnectorActorPublic(type=actor_type, label=actor_label)


def clear_realtime_state_for_tests() -> None:
    with _lock:
        _subscribers.clear()
