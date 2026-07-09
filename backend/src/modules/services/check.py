# keel_api/src/modules/services/check.py

"""HTTP probe logic and status transitions for service health checks."""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from datetime import UTC, datetime

import asyncpg
import httpx

from modules.services import config, repository
from modules.services.schemas import ServicePublic
from modules.services.helpers import record_to_public

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ProbeOutcome:
    last_status: str
    response_time_ms: int | None
    status_code: int | None
    error_message: str | None
    consecutive_failures: int


def _truncate_error(message: str) -> str:
    if len(message) <= config.MAX_ERROR_MESSAGE_LENGTH:
        return message
    return message[: config.MAX_ERROR_MESSAGE_LENGTH - 3] + "..."


def compute_probe_outcome(
    *,
    previous_failures: int,
    failure_threshold: int,
    status_code: int | None,
    expected_status_code: int,
    error_message: str | None,
    response_time_ms: int | None,
) -> ProbeOutcome:
    """Apply up / caution / down rules from a probe result."""
    if error_message is None and status_code == expected_status_code:
        return ProbeOutcome(
            last_status="up",
            response_time_ms=response_time_ms,
            status_code=status_code,
            error_message=None,
            consecutive_failures=0,
        )

    consecutive_failures = previous_failures + 1
    last_status = "down" if consecutive_failures >= failure_threshold else "caution"
    return ProbeOutcome(
        last_status=last_status,
        response_time_ms=response_time_ms,
        status_code=status_code,
        error_message=_truncate_error(error_message) if error_message else None,
        consecutive_failures=consecutive_failures,
    )


async def execute_http_probe(url: str) -> tuple[int | None, int | None, str | None]:
    """GET the URL and return (status_code, response_time_ms, error_message)."""
    started = time.perf_counter()
    try:
        async with httpx.AsyncClient(
            timeout=config.PROBE_TIMEOUT_SECONDS,
            follow_redirects=True,
        ) as client:
            response = await client.get(url)
        elapsed_ms = int((time.perf_counter() - started) * 1000)
        return response.status_code, elapsed_ms, None
    except httpx.HTTPError as exc:
        elapsed_ms = int((time.perf_counter() - started) * 1000)
        return None, elapsed_ms, str(exc)


async def probe_service_row(
    conn: asyncpg.Connection,
    row: asyncpg.Record,
    *,
    checked_at: datetime | None = None,
) -> ServicePublic:
    """Probe one service row, persist the outcome, and return the public model."""
    service_id = int(row["id"])
    status_code, response_time_ms, probe_error = await execute_http_probe(row["url"])

    if probe_error is not None:
        outcome = compute_probe_outcome(
            previous_failures=int(row["consecutive_failures"]),
            failure_threshold=int(row["failure_threshold"]),
            status_code=None,
            expected_status_code=int(row["expected_status_code"]),
            error_message=probe_error,
            response_time_ms=response_time_ms,
        )
    elif status_code != int(row["expected_status_code"]):
        outcome = compute_probe_outcome(
            previous_failures=int(row["consecutive_failures"]),
            failure_threshold=int(row["failure_threshold"]),
            status_code=status_code,
            expected_status_code=int(row["expected_status_code"]),
            error_message=f"Expected HTTP {row['expected_status_code']}, got {status_code}",
            response_time_ms=response_time_ms,
        )
    else:
        outcome = compute_probe_outcome(
            previous_failures=int(row["consecutive_failures"]),
            failure_threshold=int(row["failure_threshold"]),
            status_code=status_code,
            expected_status_code=int(row["expected_status_code"]),
            error_message=None,
            response_time_ms=response_time_ms,
        )

    checked = checked_at or datetime.now(UTC)
    updated = await repository.update_service_check_result(
        conn,
        service_id,
        last_status=outcome.last_status,
        last_checked_at=checked,
        response_time_ms=outcome.response_time_ms,
        status_code=outcome.status_code,
        error_message=outcome.error_message,
        consecutive_failures=outcome.consecutive_failures,
    )
    if updated is None:
        raise RuntimeError(f"Service {service_id} disappeared during probe update.")

    logger.info(
        "Service health check completed",
        extra={
            "service_id": service_id,
            "service_name": row["service_name"],
            "last_status": outcome.last_status,
            "status_code": outcome.status_code,
            "consecutive_failures": outcome.consecutive_failures,
        },
    )
    return record_to_public(updated)
