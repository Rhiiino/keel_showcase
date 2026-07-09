# stack_sandbox/backend/src/modules/auth/repository.py
"""SQL access for auth (users + sessions)."""

from __future__ import annotations

from datetime import datetime

import asyncpg

from core.tables import SESSIONS, USERS


# ----- Users
async def upsert_user(
    conn: asyncpg.Connection,
    *,
    provider: str,
    provider_user_id: str,
    email: str,
    display_name: str,
    picture_url: str | None,
) -> asyncpg.Record:
    """Insert or update a user row keyed by provider identity."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {USERS} (
            provider,
            provider_user_id,
            email,
            display_name,
            picture_url
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (provider, provider_user_id)
        DO UPDATE SET
            email = EXCLUDED.email,
            display_name = EXCLUDED.display_name,
            picture_url = COALESCE(users.picture_url, EXCLUDED.picture_url),
            updated_at = NOW()
        RETURNING
            id,
            provider,
            email,
            display_name,
            picture_url,
            contact_id,
            (xmax = 0) AS is_insert
        """,
        provider,
        provider_user_id,
        email,
        display_name,
        picture_url,
    )
    if row is None:
        raise RuntimeError("Failed to upsert auth user.")
    return row


async def list_users(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    """Return all users ordered by id."""
    return await conn.fetch(
        f"""
        SELECT id, email, display_name
        FROM {USERS}
        ORDER BY id
        """
    )


async def get_user_by_id(conn: asyncpg.Connection, user_id: int) -> asyncpg.Record | None:
    """Fetch one user by primary key."""
    return await conn.fetchrow(
        f"""
        SELECT id, provider, email, display_name, picture_url, contact_id
        FROM {USERS}
        WHERE id = $1
        """,
        user_id,
    )


async def update_user_profile(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    display_name: str | None = None,
    picture_url: str | None = None,
    set_display_name: bool = False,
    set_picture_url: bool = False,
) -> asyncpg.Record | None:
    """Update one or more profile fields on the current user."""
    if not set_display_name and not set_picture_url:
        raise ValueError("At least one profile field must be updated.")

    assignments = ["updated_at = NOW()"]
    args: list[object] = [user_id]
    next_index = 2

    if set_display_name:
        assignments.append(f"display_name = ${next_index}")
        args.append(display_name)
        next_index += 1

    if set_picture_url:
        assignments.append(f"picture_url = ${next_index}")
        args.append(picture_url)
        next_index += 1

    return await conn.fetchrow(
        f"""
        UPDATE {USERS}
        SET {", ".join(assignments)}
        WHERE id = $1
        RETURNING id, provider, email, display_name, picture_url, contact_id
        """,
        *args,
    )


# ----- Sessions
async def invalidate_user_sessions(conn: asyncpg.Connection, user_id: int) -> None:
    """Invalidate all active sessions for a user."""
    await conn.execute(
        f"""
        UPDATE {SESSIONS}
        SET invalidated_at = NOW()
        WHERE user_id = $1 AND invalidated_at IS NULL
        """,
        user_id,
    )


async def enforce_active_session_limit(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    keep: int,
) -> None:
    """Invalidate excess active sessions, keeping the most recently used up to `keep`."""
    if keep <= 0:
        await invalidate_user_sessions(conn, user_id)
        return

    await conn.execute(
        f"""
        UPDATE {SESSIONS}
        SET invalidated_at = NOW()
        WHERE user_id = $1
            AND invalidated_at IS NULL
            AND expires_at > NOW()
            AND id NOT IN (
                SELECT id
                FROM {SESSIONS}
                WHERE user_id = $1
                    AND invalidated_at IS NULL
                    AND expires_at > NOW()
                ORDER BY COALESCE(last_seen_at, created_at) DESC
                LIMIT $2
            )
        """,
        user_id,
        keep,
    )


async def create_session(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    session_token_hash: str,
    expires_at: datetime,
    ip_address: str | None,
) -> None:
    """Insert a new session row for a user."""
    await conn.execute(
        f"""
        INSERT INTO {SESSIONS} (
            user_id,
            session_token_hash,
            expires_at,
            ip_address,
            last_seen_at
        )
        VALUES ($1, $2, $3, $4, NOW())
        """,
        user_id,
        session_token_hash,
        expires_at,
        ip_address,
    )


async def get_user_for_active_session(
    conn: asyncpg.Connection,
    session_token_hash: str,
) -> asyncpg.Record | None:
    """Return the user for a valid, non-expired session hash."""
    return await conn.fetchrow(
        f"""
        SELECT
            users.id,
            users.provider,
            users.email,
            users.display_name,
            users.picture_url,
            users.contact_id
        FROM {SESSIONS} AS sessions
        INNER JOIN {USERS} AS users ON users.id = sessions.user_id
        WHERE sessions.session_token_hash = $1
            AND sessions.invalidated_at IS NULL
            AND sessions.expires_at > NOW()
        """,
        session_token_hash,
    )


async def mark_session_seen(conn: asyncpg.Connection, session_token_hash: str) -> None:
    """Update last_seen_at for an active session."""
    await conn.execute(
        f"""
        UPDATE {SESSIONS}
        SET last_seen_at = NOW()
        WHERE session_token_hash = $1
            AND invalidated_at IS NULL
            AND expires_at > NOW()
        """,
        session_token_hash,
    )


async def delete_expired_sessions(conn: asyncpg.Connection) -> int:
    """Delete session rows whose expiry time is in the past."""
    result = await conn.execute(
        f"""
        DELETE FROM {SESSIONS}
        WHERE expires_at < NOW()
        """
    )
    return int(result.split()[-1])


async def invalidate_session_by_hash(
    conn: asyncpg.Connection,
    session_token_hash: str,
) -> None:
    """Invalidate a single session by token hash."""
    await conn.execute(
        f"""
        UPDATE {SESSIONS}
        SET invalidated_at = NOW()
        WHERE session_token_hash = $1
            AND invalidated_at IS NULL
        """,
        session_token_hash,
    )
