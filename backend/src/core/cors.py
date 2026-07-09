# keel_api/src/core/cors.py

"""Shared CORS origin list and request-scoped response headers."""

from __future__ import annotations

from starlette.requests import Request

from core.config import get_settings


def cors_origins() -> list[str]:
    """Return allowed browser origins for credentialed API requests."""
    settings = get_settings()
    origins = {settings.frontend_url.rstrip("/")}
    if settings.cors_extra_origins:
        for origin in settings.cors_extra_origins.split(","):
            trimmed = origin.strip().rstrip("/")
            if trimmed:
                origins.add(trimmed)
    return sorted(origins)


def cors_headers_for_request(request: Request) -> dict[str, str]:
    """Build CORS headers for a response when the Origin is allowed."""
    origin = request.headers.get("origin")
    if not origin:
        return {}

    allowed = {value.rstrip("/") for value in cors_origins()}
    if origin.rstrip("/") not in allowed:
        return {}

    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
    }
