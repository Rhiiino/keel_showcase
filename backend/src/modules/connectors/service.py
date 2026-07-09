# keel_api/src/modules/connectors/service.py

"""Shared connector helpers."""

from __future__ import annotations

from modules.connectors.auth import ConnectorSession
from modules.connectors.schemas import ConnectorSessionPublic


def to_session_public(session: ConnectorSession) -> ConnectorSessionPublic:
    return ConnectorSessionPublic(
        session_id=session.session_id,
        connector=session.connector,
        actor_label=session.actor_label,
        scopes=sorted(session.scopes),
        created_at=session.created_at,
        expires_at=session.expires_at,
        revoked=session.revoked_at is not None,
        last_used_at=session.last_used_at,
    )
