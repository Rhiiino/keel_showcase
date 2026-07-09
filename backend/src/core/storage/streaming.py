# keel_api/src/core/storage/streaming.py

"""FastAPI streaming helpers for object downloads."""

from __future__ import annotations

from collections.abc import AsyncIterator

from fastapi import Response
from starlette.responses import StreamingResponse


def streaming_object_response(
    *,
    body: AsyncIterator[bytes],
    content_type: str,
    content_length: int | None = None,
    content_range: str | None = None,
    status_code: int = 200,
    extra_headers: dict[str, str] | None = None,
) -> Response:
    """Build a streaming response for media download."""
    headers: dict[str, str] = {"Accept-Ranges": "bytes"}
    if content_length is not None:
        headers["Content-Length"] = str(content_length)
    if content_range is not None:
        headers["Content-Range"] = content_range
    if extra_headers:
        headers.update(extra_headers)

    return StreamingResponse(
        body,
        status_code=status_code,
        media_type=content_type,
        headers=headers,
    )
