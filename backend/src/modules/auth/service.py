# stack_sandbox/backend/src/modules/auth/service.py
"""Business logic for Google OAuth and cookie sessions."""

from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from secrets import token_urlsafe
from threading import Lock
from typing import Any
from urllib.parse import urlencode, urlparse

import httpx
from fastapi import Request, Response

from core.config import get_settings
from core.database import get_pool
from core.errors import AppError
from modules.auth import config, repository
from modules.auth.schemas import CurrentUserResponse, DevUserOption, UpdateCurrentUserRequest
from modules.settings import service as settings_service


def _settings():
    """Return cached application settings."""
    return get_settings()


def _session_keep_count() -> int:
    """How many existing sessions to retain before inserting a new one."""
    limit = max(_settings().max_active_sessions, 1)
    return limit - 1


_exchange_lock = Lock()
_exchange_codes: dict[str, tuple[str, float]] = {}


def hash_session_token(session_token: str) -> str:
    """Hash a raw session token with the configured session secret."""
    secret = _settings().session_secret
    if not secret:
        raise AppError("Session secret is not configured.", status_code=500)
    return sha256(f"{secret}:{session_token}".encode("utf-8")).hexdigest()



# ----- Cookie helpers
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


def build_google_authorization_url(state: str) -> str:
    """Build the Google OAuth authorization URL with CSRF state."""
    settings = _settings()
    if not settings.google_client_id:
        raise AppError("Google OAuth client ID is not configured.", status_code=500)

    query = urlencode(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": settings.google_redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "select_account",
        }
    )
    return f"{config.GOOGLE_AUTHORIZATION_URL}?{query}"


def create_oauth_state() -> str:
    """Generate a random OAuth CSRF state token."""
    return token_urlsafe(32)


async def exchange_google_code_for_user(code: str) -> dict[str, Any]:
    """Exchange an OAuth authorization code for Google user profile fields."""
    settings = _settings()
    if not settings.google_client_secret:
        raise AppError("Google OAuth client secret is not configured.", status_code=500)

    async with httpx.AsyncClient(timeout=10) as client:
        token_response = await client.post(
            config.GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.google_redirect_uri,
            },
        )
        if token_response.status_code >= 400:
            raise AppError("Google token exchange failed.", status_code=400)
        access_token = token_response.json().get("access_token")
        if not access_token:
            raise AppError("Google token exchange returned no access token.", status_code=400)

        userinfo_response = await client.get(
            config.GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_response.status_code >= 400:
            raise AppError("Google userinfo request failed.", status_code=400)
        google_user = userinfo_response.json()

    if not google_user.get("sub") or not google_user.get("email"):
        raise AppError(
            "Google did not return the required user identity fields.",
            status_code=400,
        )

    return google_user


async def create_login_session(
    *,
    google_user: dict[str, Any],
    request: Request,
) -> tuple[str, datetime]:
    """Upsert the Google user, enforce session cap, and create a new session."""
    settings = _settings()
    pool = get_pool()
    session_token = token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.session_ttl_seconds)
    ip_address = request.client.host if request.client else None

    async with pool.acquire() as conn:
        async with conn.transaction():
            user = await repository.upsert_user(
                conn,
                provider="google",
                provider_user_id=google_user["sub"],
                email=google_user["email"],
                display_name=google_user.get("name") or google_user["email"],
                picture_url=google_user.get("picture"),
            )
            if user["is_insert"]:
                await settings_service.seed_new_user_defaults(user["id"], conn=conn)
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

    return session_token, expires_at


async def list_dev_users() -> list[DevUserOption]:
    """List all users for lab dev login selection."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_users(conn)

    return [
        DevUserOption(
            id=row["id"],
            email=row["email"],
            display_name=row["display_name"],
        )
        for row in rows
    ]


async def create_session_for_user(
    *,
    user_id: int,
    request: Request,
) -> tuple[str, CurrentUserResponse]:
    """Create a session for an existing user (lab dev login)."""
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


def set_oauth_state_cookie(
    response: Response,
    state: str,
    post_auth_redirect: str | None = None,
) -> None:
    """Set the short-lived OAuth CSRF state cookie (optionally bundling iOS post-auth redirect)."""
    value = pack_oauth_state_cookie(state, post_auth_redirect)
    response.set_cookie(
        key=config.OAUTH_STATE_COOKIE_NAME,
        value=value,
        max_age=config.OAUTH_STATE_MAX_AGE_SECONDS,
        **_cookie_options(),
    )


def pack_oauth_state_cookie(state: str, post_auth_redirect: str | None) -> str:
    """Store OAuth state and optional post-auth redirect in one cookie value."""
    if not post_auth_redirect:
        return state
    return f"{state}{config.OAUTH_STATE_REDIRECT_SEPARATOR}{post_auth_redirect}"


def unpack_oauth_state_cookie(raw: str | None) -> tuple[str | None, str | None]:
    """Split bundled OAuth state cookie into CSRF state and optional post-auth redirect."""
    if not raw:
        return None, None
    if config.OAUTH_STATE_REDIRECT_SEPARATOR not in raw:
        return raw, None
    state, redirect = raw.split(config.OAUTH_STATE_REDIRECT_SEPARATOR, 1)
    return state or None, redirect or None


def clear_oauth_state_cookie(response: Response) -> None:
    """Delete the OAuth CSRF state cookie."""
    response.delete_cookie(
        key=config.OAUTH_STATE_COOKIE_NAME,
        **_cookie_options(),
    )


def validate_post_auth_redirect(url: str | None) -> str | None:
    """Allow only the iOS custom-scheme redirect used by ASWebAuthenticationSession."""
    if url is None:
        return None
    if not url.startswith(config.IOS_POST_AUTH_REDIRECT_PREFIX):
        raise AppError("Invalid post-auth redirect.", status_code=400)
    return url


def build_ios_oauth_dismiss_url(post_auth_redirect: str, exchange_code: str) -> str:
    """Build an HTTPS page that stores the session cookie before opening the app scheme."""
    settings = _settings()
    parsed = urlparse(settings.google_redirect_uri)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    target = f"{post_auth_redirect}/{exchange_code}"
    query = urlencode({"target": target})
    return f"{origin}{config.ROUTE_PREFIX}{config.OAUTH_DISMISS_PATH}?{query}"


def store_mobile_exchange_code(session_token: str) -> str:
    """Create a short-lived one-time code for native iOS session handoff."""
    code = token_urlsafe(32)
    expires_at = time.time() + config.OAUTH_STATE_MAX_AGE_SECONDS
    with _exchange_lock:
        _purge_expired_exchange_codes()
        _exchange_codes[code] = (session_token, expires_at)
    return code


def consume_mobile_exchange_code(code: str) -> str | None:
    """Return the session token for a one-time iOS exchange code, if valid."""
    with _exchange_lock:
        entry = _exchange_codes.pop(code, None)
    if entry is None:
        return None
    session_token, expires_at = entry
    if time.time() > expires_at:
        return None
    return session_token


def _purge_expired_exchange_codes() -> None:
    now = time.time()
    expired = [key for key, (_, expires_at) in _exchange_codes.items() if expires_at <= now]
    for key in expired:
        _exchange_codes.pop(key, None)


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
