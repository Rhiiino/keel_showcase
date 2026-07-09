# keel_api/src/modules/connectors/auth.py

"""In-memory connector session registry and bearer-token validation."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from hashlib import sha256
from secrets import token_urlsafe
from threading import Lock
from typing import Annotated

from fastapi import Header, Request

from core.config import get_settings
from core.errors import AppError
from modules.connectors import config


@dataclass
class ConnectorSession:
    session_id: str
    token_hash: str
    user_id: int
    connector: str
    scopes: frozenset[str]
    actor_label: str
    created_at: datetime
    expires_at: datetime
    revoked_at: datetime | None = None
    last_used_at: datetime | None = None


@dataclass
class _IdempotencyEntry:
    created_at: float
    response: dict


_sessions_by_hash: dict[str, ConnectorSession] = {}
_user_active_hash: dict[tuple[int, str], str] = {}
_idempotency_cache: dict[tuple[str, str], _IdempotencyEntry] = {}
_lock = Lock()


def _settings():
    return get_settings()


def hash_connector_token(token: str) -> str:
    secret = _settings().session_secret
    if not secret:
        raise AppError("Session secret is not configured.", status_code=500)
    return sha256(f"connector:{secret}:{token}".encode("utf-8")).hexdigest()


def _purge_expired_sessions() -> None:
    now = datetime.now(UTC)
    expired_hashes: list[str] = []
    for token_hash, session in _sessions_by_hash.items():
        if session.revoked_at is not None or session.expires_at <= now:
            expired_hashes.append(token_hash)
    for token_hash in expired_hashes:
        session = _sessions_by_hash.pop(token_hash, None)
        if session is None:
            continue
        key = (session.user_id, session.connector)
        if _user_active_hash.get(key) == token_hash:
            _user_active_hash.pop(key, None)


def _purge_expired_idempotency() -> None:
    now = time.time()
    ttl = max(_settings().connector_token_ttl_seconds, 60)
    expired = [
        key
        for key, entry in _idempotency_cache.items()
        if now - entry.created_at > ttl
    ]
    for key in expired:
        _idempotency_cache.pop(key, None)



# ----- Session lifecycle
def create_connector_session(
    *,
    user_id: int,
    connector: str,
    actor_label: str,
    scopes: frozenset[str] | None = None,
) -> tuple[str, ConnectorSession]:
    _purge_expired_sessions()
    raw_token = token_urlsafe(32)
    token_hash = hash_connector_token(raw_token)
    now = datetime.now(UTC)
    ttl = max(_settings().connector_token_ttl_seconds, 60)
    session = ConnectorSession(
        session_id=token_urlsafe(16),
        token_hash=token_hash,
        user_id=user_id,
        connector=connector,
        scopes=scopes or config.DEFAULT_FOCUS_SCOPES,
        actor_label=actor_label.strip() or "External LLM",
        created_at=now,
        expires_at=now + timedelta(seconds=ttl),
    )
    with _lock:
        _revoke_connector_session_for_user_unlocked(user_id=user_id, connector=connector)
        _sessions_by_hash[token_hash] = session
        _user_active_hash[(user_id, connector)] = token_hash
    return raw_token, session


def get_active_session_for_user(*, user_id: int, connector: str) -> ConnectorSession | None:
    _purge_expired_sessions()
    with _lock:
        token_hash = _user_active_hash.get((user_id, connector))
        if token_hash is None:
            return None
        session = _sessions_by_hash.get(token_hash)
        if session is None or session.revoked_at is not None:
            return None
        if session.expires_at <= datetime.now(UTC):
            return None
        return session


def _revoke_connector_session_for_user_unlocked(
    *,
    user_id: int,
    connector: str,
) -> ConnectorSession | None:
    token_hash = _user_active_hash.pop((user_id, connector), None)
    if token_hash is None:
        return None
    session = _sessions_by_hash.get(token_hash)
    if session is None:
        return None
    session.revoked_at = datetime.now(UTC)
    return session


def revoke_connector_session_for_user(*, user_id: int, connector: str) -> ConnectorSession | None:
    with _lock:
        return _revoke_connector_session_for_user_unlocked(
            user_id=user_id,
            connector=connector,
        )


def resolve_connector_session_from_token(
    *,
    raw_token: str,
    connector: str,
) -> ConnectorSession:
    _purge_expired_sessions()
    token_hash = hash_connector_token(raw_token)
    with _lock:
        session = _sessions_by_hash.get(token_hash)
    if session is None:
        raise AppError("Invalid or expired connector token.", status_code=401)
    if session.connector != connector:
        raise AppError("Connector token does not match this connector.", status_code=403)
    if session.revoked_at is not None:
        raise AppError("Connector session has been revoked.", status_code=401)
    if session.expires_at <= datetime.now(UTC):
        raise AppError("Connector session has expired.", status_code=401)
    with _lock:
        session.last_used_at = datetime.now(UTC)
    return session


def require_scope(session: ConnectorSession, scope: str) -> None:
    if scope not in session.scopes:
        raise AppError(f"Connector token is missing required scope: {scope}.", status_code=403)



# ----- Idempotency cache
def get_idempotent_response(
    *,
    token_hash: str,
    idempotency_key: str | None,
) -> dict | None:
    if not idempotency_key:
        return None
    _purge_expired_idempotency()
    with _lock:
        entry = _idempotency_cache.get((token_hash, idempotency_key))
    return None if entry is None else entry.response


def store_idempotent_response(
    *,
    token_hash: str,
    idempotency_key: str | None,
    response: dict,
) -> None:
    if not idempotency_key:
        return
    with _lock:
        _idempotency_cache[(token_hash, idempotency_key)] = _IdempotencyEntry(
            created_at=time.time(),
            response=response,
        )


def clear_connector_state_for_tests() -> None:
    with _lock:
        _sessions_by_hash.clear()
        _user_active_hash.clear()
        _idempotency_cache.clear()



# ----- FastAPI dependency
def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise AppError("Missing connector bearer token.", status_code=401)
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise AppError("Invalid Authorization header.", status_code=401)
    return token.strip()


async def require_focus_connector_session(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> ConnectorSession:
    raw_token = _extract_bearer_token(authorization)
    return resolve_connector_session_from_token(raw_token=raw_token, connector="focus")
