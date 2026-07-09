# keel_api/src/modules/services/helpers.py

"""Shared mappers for service rows."""

from __future__ import annotations

import asyncpg

from modules.services.schemas import ServicePublic


def record_to_public(row: asyncpg.Record) -> ServicePublic:
    """Map a database row to ServicePublic."""
    return ServicePublic(
        id=int(row["id"]),
        user_id=int(row["user_id"]),
        service_name=row["service_name"],
        url=row["url"],
        service_type=row["service_type"],
        description=row["description"],
        check_enabled=bool(row["check_enabled"]),
        expected_status_code=int(row["expected_status_code"]),
        failure_threshold=int(row["failure_threshold"]),
        last_status=row["last_status"],
        last_checked_at=row["last_checked_at"],
        response_time_ms=row["response_time_ms"],
        status_code=row["status_code"],
        error_message=row["error_message"],
        consecutive_failures=int(row["consecutive_failures"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )
