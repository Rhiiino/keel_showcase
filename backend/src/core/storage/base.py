# keel_api/src/core/storage/base.py

"""Storage backend protocol for object storage."""

from __future__ import annotations

from dataclasses import dataclass
from typing import AsyncIterator, Protocol


@dataclass(frozen=True)
class StoredObject:
    """Metadata for one stored object."""

    content_type: str
    content_length: int
    body: AsyncIterator[bytes]
    content_range: str | None = None


@dataclass(frozen=True)
class ObjectHead:
    """Head metadata for one stored object."""

    content_type: str
    content_length: int


class StorageBackend(Protocol):
    """Async object storage (S3-compatible)."""

    async def put_object(
        self,
        key: str,
        body: bytes,
        *,
        content_type: str,
    ) -> None:
        """Upload an object."""

    async def get_object(
        self,
        key: str,
        *,
        range_header: str | None = None,
    ) -> StoredObject:
        """Download an object, optionally with HTTP Range."""

    async def head_object(self, key: str) -> ObjectHead:
        """Return object metadata without body."""

    async def delete_object(self, key: str) -> None:
        """Delete an object if it exists."""
