# keel_api/src/modules/deleted/handlers/_protocol.py
"""Handler protocol for deleted entity types."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

import asyncpg


@dataclass(frozen=True)
class CaptureResult:
    display_label: str
    payload: dict[str, Any]


class DeletedEntityHandler(Protocol):
    entity_type: str

    async def capture(
        self,
        conn: asyncpg.Connection,
        *,
        user_id: int,
        entity_id: str,
    ) -> CaptureResult:
        ...

    async def delete_source(
        self,
        conn: asyncpg.Connection,
        *,
        user_id: int,
        entity_id: str,
    ) -> None:
        ...

    async def restore(
        self,
        conn: asyncpg.Connection,
        *,
        user_id: int,
        payload: dict[str, Any],
    ) -> str:
        ...

    async def purge(
        self,
        conn: asyncpg.Connection,
        *,
        user_id: int,
        payload: dict[str, Any],
    ) -> None:
        ...
