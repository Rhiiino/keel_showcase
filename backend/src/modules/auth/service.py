# backend/src/modules/auth/service.py
"""Business logic for showcase session auth."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from hashlib import sha256
from secrets import token_urlsafe

from fastapi import Request, Response

from core.config import get_settings
from core.database import get_pool
from core.errors import AppError
from modules.auth import repository
from modules.auth.schemas import CurrentUserResponse, UpdateCurrentUserRequest


def _settings():
    """Return cached application settings."""
    return get_settings()


def _session_keep_count() -> int:
    """How many existing sessions to retain before inserting a new one."""
    limit = max(_settings().max_active_sessions, 1)
    return limit - 1


def hash_session_token(session_token: str) -> str:
    """Hash a raw session token with the configured session secret."""
    secret = _settings().session_secret
    if not secret:
        raise AppError("Session secret is not configured.", status_code=500)
    return sha256(f"{secret}:{session_token}".encode("utf-8")).hexdigest()


def _cookie_domain() -> str | None:
    """Optional parent domain for auth cookies; default is host-only per API hostname."""
    domain = _settings().session_cookie_domain.strip()
    return domain if domain else None


def _cookie_options() -> dict[str, object]:
    settings = _settings()
    options: dict[str, object] = {
        "httponly": True,
        "secure": settings.session_cookie_secure,
        "samesite": settings.session_cookie_samesite,
        "path": "/",
    }
    domain = _cookie_domain()
    if domain:
        options["domain"] = domain
    return options


async def create_session_for_user(
    *,
    user_id: int,
    request: Request,
) -> tuple[str, CurrentUserResponse]:
    """Create a session for an existing user (showcase Enter login)."""
    settings = _settings()
    pool = get_pool()
    session_token = token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.session_ttl_seconds)
    ip_address = request.client.host if request.client else None

    async with pool.acquire() as conn:
        user = await repository.get_user_by_id(conn, user_id)
        if user is None:
            raise AppError("User not found.", status_code=404)

        async with conn.transaction():
            await repository.enforce_active_session_limit(
                conn,
                user_id=user["id"],
                keep=_session_keep_count(),
            )
            await repository.create_session(
                conn,
                user_id=user["id"],
                session_token_hash=hash_session_token(session_token),
                expires_at=expires_at,
                ip_address=ip_address,
            )

    current_user = CurrentUserResponse(
        id=user["id"],
        provider=user["provider"],
        email=user["email"],
        display_name=user["display_name"],
        picture_url=user["picture_url"],
        contact_id=user["contact_id"],
    )
    return session_token, current_user


def set_session_cookie(response: Response, session_token: str) -> None:
    """Set the HTTP-only session cookie on a response."""
    settings = _settings()
    response.set_cookie(
        key=settings.session_cookie_name,
        value=session_token,
        max_age=settings.session_ttl_seconds,
        **_cookie_options(),
    )


def clear_session_cookie(response: Response) -> None:
    """Delete the session cookie from a response."""
    settings = _settings()
    response.delete_cookie(
        key=settings.session_cookie_name,
        **_cookie_options(),
    )


async def update_current_user(
    user_id: int,
    payload: UpdateCurrentUserRequest,
) -> CurrentUserResponse:
    """Update the current user's profile fields."""
    set_display_name = payload.display_name is not None
    set_picture_url = "picture_url" in payload.model_fields_set

    display_name: str | None = None
    if set_display_name:
        display_name = payload.display_name.strip() if payload.display_name else ""
        if not display_name:
            raise AppError("display_name must not be empty.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.update_user_profile(
            conn,
            user_id=user_id,
            display_name=display_name,
            picture_url=payload.picture_url,
            set_display_name=set_display_name,
            set_picture_url=set_picture_url,
        )

    if row is None:
        raise AppError("User not found.", status_code=404)

    return CurrentUserResponse(
        id=row["id"],
        provider=row["provider"],
        email=row["email"],
        display_name=row["display_name"],
        picture_url=row["picture_url"],
        contact_id=row["contact_id"],
    )


async def get_current_user(request: Request) -> CurrentUserResponse:
    """Resolve and return the current user from the session cookie."""
    settings = _settings()
    session_token = request.cookies.get(settings.session_cookie_name)
    if not session_token:
        raise AppError("Missing auth session.", status_code=401)

    user = await get_current_user_for_session_token(session_token)
    session_token_hash = hash_session_token(session_token)
    pool = get_pool()
    async with pool.acquire() as conn:
        await repository.mark_session_seen(conn, session_token_hash)
    return user


async def get_current_user_for_session_token(session_token: str) -> CurrentUserResponse:
    """Resolve and return the current user from a raw session token."""
    session_token_hash = hash_session_token(session_token)
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.get_user_for_active_session(conn, session_token_hash)
        if row is None:
            raise AppError("Invalid or expired auth session.", status_code=401)

    return CurrentUserResponse(
        id=row["id"],
        provider=row["provider"],
        email=row["email"],
        display_name=row["display_name"],
        picture_url=row["picture_url"],
        contact_id=row["contact_id"],
    )


async def logout_current_session(request: Request, response: Response) -> None:
    """Invalidate the current session and clear the session cookie."""
    settings = _settings()
    session_token = request.cookies.get(settings.session_cookie_name)
    if session_token:
        pool = get_pool()
        async with pool.acquire() as conn:
            await repository.invalidate_session_by_hash(
                conn,
                hash_session_token(session_token),
            )
    clear_session_cookie(response)
