# keel_api/src/modules/connectors/test_connectors_auth.py

"""Unit tests for in-memory connector session auth."""

from __future__ import annotations

import pytest

from core.errors import AppError
from modules.connectors.auth import (
    clear_connector_state_for_tests,
    create_connector_session,
    get_active_session_for_user,
    hash_connector_token,
    require_scope,
    resolve_connector_session_from_token,
    revoke_connector_session_for_user,
    store_idempotent_response,
    get_idempotent_response,
)


@pytest.fixture(autouse=True)
def _reset_state(monkeypatch: pytest.MonkeyPatch) -> None:
    clear_connector_state_for_tests()
    monkeypatch.setenv("SESSION_SECRET", "test-session-secret")


def test_create_and_resolve_connector_session() -> None:
    raw_token, session = create_connector_session(
        user_id=7,
        connector="focus",
        actor_label="Codex",
        scopes=frozenset({"focus:read", "focus:write"}),
    )
    assert session.user_id == 7
    assert session.actor_label == "Codex"
    resolved = resolve_connector_session_from_token(raw_token=raw_token, connector="focus")
    assert resolved.session_id == session.session_id
    assert resolved.last_used_at is not None


def test_revoked_session_is_rejected() -> None:
    raw_token, _session = create_connector_session(
        user_id=7,
        connector="focus",
        actor_label="Codex",
        scopes=frozenset({"focus:read"}),
    )
    revoked = revoke_connector_session_for_user(user_id=7, connector="focus")
    assert revoked is not None
    with pytest.raises(AppError) as exc:
        resolve_connector_session_from_token(raw_token=raw_token, connector="focus")
    assert exc.value.status_code == 401


def test_scope_enforcement() -> None:
    _raw_token, session = create_connector_session(
        user_id=7,
        connector="focus",
        actor_label="Codex",
        scopes=frozenset({"focus:read"}),
    )
    require_scope(session, "focus:read")
    with pytest.raises(AppError) as exc:
        require_scope(session, "focus:write")
    assert exc.value.status_code == 403


def test_only_one_active_session_per_user_and_connector() -> None:
    first_token, first_session = create_connector_session(
        user_id=7,
        connector="focus",
        actor_label="Codex",
        scopes=frozenset({"focus:read"}),
    )
    second_token, second_session = create_connector_session(
        user_id=7,
        connector="focus",
        actor_label="Codex",
        scopes=frozenset({"focus:read"}),
    )
    assert first_session.session_id != second_session.session_id
    with pytest.raises(AppError):
        resolve_connector_session_from_token(raw_token=first_token, connector="focus")
    resolve_connector_session_from_token(raw_token=second_token, connector="focus")
    active = get_active_session_for_user(user_id=7, connector="focus")
    assert active is not None
    assert active.session_id == second_session.session_id


def test_idempotency_cache_round_trip() -> None:
    _raw_token, session = create_connector_session(
        user_id=7,
        connector="focus",
        actor_label="Codex",
        scopes=frozenset({"focus:read"}),
    )
    payload = {"tool_name": "list_focus_nodes", "result": {"nodes": []}}
    store_idempotent_response(
        token_hash=session.token_hash,
        idempotency_key="abc",
        response=payload,
    )
    cached = get_idempotent_response(token_hash=session.token_hash, idempotency_key="abc")
    assert cached == payload


def test_hash_connector_token_requires_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SESSION_SECRET", "")
    from core.config import get_settings

    get_settings.cache_clear()
    with pytest.raises(AppError):
        hash_connector_token("token")
    monkeypatch.setenv("SESSION_SECRET", "test-session-secret")
    get_settings.cache_clear()
