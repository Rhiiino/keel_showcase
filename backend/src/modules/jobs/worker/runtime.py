# keel_api/src/modules/jobs/worker/runtime.py
"""Async bridge and Celery worker lifecycle hooks for asyncpg."""

from __future__ import annotations

import asyncio
from collections.abc import Coroutine
from typing import Any, TypeVar

from celery.signals import beat_init, worker_process_init, worker_process_shutdown

from core.database import close_pool, init_pool

T = TypeVar("T")

_worker_loop: asyncio.AbstractEventLoop | None = None


def _get_worker_loop() -> asyncio.AbstractEventLoop:
    """Return the persistent event loop for this worker child process."""
    global _worker_loop
    if _worker_loop is None or _worker_loop.is_closed():
        _worker_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(_worker_loop)
    return _worker_loop


def run_async(coro: Coroutine[Any, Any, T]) -> T:
    """Run an async coroutine on the worker's persistent event loop."""
    return _get_worker_loop().run_until_complete(coro)


@worker_process_init.connect
def init_worker_db(**_kwargs: object) -> None:
    """Open the asyncpg pool once per worker child process."""
    run_async(init_pool())


@beat_init.connect
def init_beat_db(**_kwargs: object) -> None:
    """Open the asyncpg pool so Beat can sync schedules from Postgres."""
    run_async(init_pool())


@worker_process_shutdown.connect
def shutdown_worker_db(**_kwargs: object) -> None:
    """Close the asyncpg pool when a worker child process exits."""
    _shutdown_loop_pool()


def _shutdown_loop_pool() -> None:
    global _worker_loop
    loop = _worker_loop
    if loop is None or loop.is_closed():
        return
    loop.run_until_complete(close_pool())
    loop.close()
    _worker_loop = None
