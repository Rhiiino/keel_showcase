# keel_api/src/modules/services/repository.py

"""SQL access for HTTP service health monitors."""

from __future__ import annotations

from datetime import datetime

import asyncpg

from core.tables import SERVICES

_UNSET = object()

_COLUMNS = """
    id,
    user_id,
    service_name,
    url,
    service_type,
    description,
    check_enabled,
    expected_status_code,
    failure_threshold,
    last_status,
    last_checked_at,
    response_time_ms,
    status_code,
    error_message,
    consecutive_failures,
    created_at,
    updated_at
"""



# ----- Services table operations
async def list_services(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[asyncpg.Record]:
    """List service rows for a user ordered by name."""
    return await conn.fetch(
        f"""
        SELECT {_COLUMNS}
        FROM {SERVICES}
        WHERE user_id = $1
        ORDER BY lower(service_name), id
        """,
        user_id,
    )


async def get_service(
    conn: asyncpg.Connection,
    service_id: int,
) -> asyncpg.Record | None:
    """Fetch one service row by id."""
    return await conn.fetchrow(
        f"""
        SELECT {_COLUMNS}
        FROM {SERVICES}
        WHERE id = $1
        """,
        service_id,
    )


async def insert_service(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    service_name: str,
    url: str,
    service_type: str,
    description: str | None,
    check_enabled: bool,
    expected_status_code: int,
    failure_threshold: int,
) -> asyncpg.Record:
    """Insert a service row."""
    return await conn.fetchrow(
        f"""
        INSERT INTO {SERVICES} (
            user_id,
            service_name,
            url,
            service_type,
            description,
            check_enabled,
            expected_status_code,
            failure_threshold
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING {_COLUMNS}
        """,
        user_id,
        service_name,
        url,
        service_type,
        description,
        check_enabled,
        expected_status_code,
        failure_threshold,
    )


async def update_service(
    conn: asyncpg.Connection,
    service_id: int,
    *,
    service_name: str | None = None,
    url: str | None = None,
    service_type: str | None = None,
    description: str | None | object = _UNSET,
    check_enabled: bool | None = None,
    expected_status_code: int | None = None,
    failure_threshold: int | None = None,
) -> asyncpg.Record | None:
    """Patch config fields on one service row."""
    assignments: list[str] = []
    params: list[object] = []
    param_index = 1

    field_updates: list[tuple[str, object | None]] = [
        ("service_name", service_name),
        ("url", url),
        ("service_type", service_type),
        ("check_enabled", check_enabled),
        ("expected_status_code", expected_status_code),
        ("failure_threshold", failure_threshold),
    ]
    for column, value in field_updates:
        if value is None:
            continue
        assignments.append(f"{column} = ${param_index}")
        params.append(value)
        param_index += 1

    if description is not _UNSET:
        assignments.append(f"description = ${param_index}")
        params.append(description)
        param_index += 1

    if not assignments:
        return await get_service(conn, service_id)

    assignments.append("updated_at = NOW()")
    params.append(service_id)

    return await conn.fetchrow(
        f"""
        UPDATE {SERVICES}
        SET {", ".join(assignments)}
        WHERE id = ${param_index}
        RETURNING {_COLUMNS}
        """,
        *params,
    )


async def delete_service(conn: asyncpg.Connection, service_id: int) -> bool:
    """Delete one service row. Returns True when a row was removed."""
    result = await conn.execute(
        f"""
        DELETE FROM {SERVICES}
        WHERE id = $1
        """,
        service_id,
    )
    return result.endswith("1")


async def fetch_services_for_check(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    """Load all services marked for scheduled health checks."""
    return await conn.fetch(
        f"""
        SELECT {_COLUMNS}
        FROM {SERVICES}
        WHERE check_enabled = TRUE
        ORDER BY id
        """,
    )


async def update_service_check_result(
    conn: asyncpg.Connection,
    service_id: int,
    *,
    last_status: str,
    last_checked_at: datetime,
    response_time_ms: int | None,
    status_code: int | None,
    error_message: str | None,
    consecutive_failures: int,
) -> asyncpg.Record | None:
    """Persist probe outcome fields after a health check."""
    return await conn.fetchrow(
        f"""
        UPDATE {SERVICES}
        SET
            last_status = $2,
            last_checked_at = $3,
            response_time_ms = $4,
            status_code = $5,
            error_message = $6,
            consecutive_failures = $7,
            updated_at = NOW()
        WHERE id = $1
        RETURNING {_COLUMNS}
        """,
        service_id,
        last_status,
        last_checked_at,
        response_time_ms,
        status_code,
        error_message,
        consecutive_failures,
    )
