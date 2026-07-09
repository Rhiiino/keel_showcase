# keel_api/src/modules/services/service.py

"""Business logic for HTTP service health monitors."""

from __future__ import annotations

import re

import asyncpg
from asyncpg.exceptions import UniqueViolationError

from core.database import get_pool
from core.errors import AppError
from modules.services import config, repository
from modules.services.check import probe_service_row
from modules.services.schemas import ServiceCreate, ServicePublic, ServiceUpdate, ServiceType


from modules.services.helpers import record_to_public

# ----- Validation helpers
def _normalize_service_name(name: str) -> str:
    normalized = name.strip()
    if not normalized:
        raise AppError("Service name is required.", status_code=400)
    if len(normalized) > 200:
        raise AppError("Service name must be at most 200 characters.", status_code=400)
    return normalized


def _normalize_url(url: str) -> str:
    normalized = url.strip()
    if not normalized:
        raise AppError("URL is required.", status_code=400)
    if len(normalized) > 2048:
        raise AppError("URL must be at most 2048 characters.", status_code=400)
    if re.match(r"^https?://", normalized, re.IGNORECASE) is None:
        raise AppError("URL must start with http:// or https://.", status_code=400)
    return normalized


def _normalize_description(description: str | None) -> str | None:
    if description is None:
        return None
    normalized = description.strip()
    if not normalized:
        return None
    if len(normalized) > 2000:
        raise AppError("Description must be at most 2000 characters.", status_code=400)
    return normalized


def _normalize_service_type(service_type: ServiceType) -> ServiceType:
    if service_type not in ("frontend", "backend"):
        raise AppError("Service type must be frontend or backend.", status_code=400)
    return service_type


async def _get_owned_service_row(
    conn: asyncpg.Connection,
    user_id: int,
    service_id: int,
) -> asyncpg.Record:
    row = await repository.get_service(conn, service_id)
    if row is None or int(row["user_id"]) != user_id:
        raise AppError("Service not found.", status_code=404)
    return row



# ----- Service CRUD
async def list_services(user_id: int) -> list[ServicePublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_services(conn, user_id)
    return [record_to_public(row) for row in rows]


async def get_service(user_id: int, service_id: int) -> ServicePublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await _get_owned_service_row(conn, user_id, service_id)
    return record_to_public(row)


async def create_service(user_id: int, payload: ServiceCreate) -> ServicePublic:
    service_name = _normalize_service_name(payload.service_name)
    url = _normalize_url(payload.url)
    service_type = _normalize_service_type(payload.service_type)
    description = _normalize_description(payload.description)

    pool = get_pool()
    async with pool.acquire() as conn:
        try:
            row = await repository.insert_service(
                conn,
                user_id=user_id,
                service_name=service_name,
                url=url,
                service_type=service_type,
                description=description,
                check_enabled=payload.check_enabled,
                expected_status_code=payload.expected_status_code,
                failure_threshold=payload.failure_threshold,
            )
        except UniqueViolationError as exc:
            raise AppError(
                "A service with this name and type already exists.",
                status_code=409,
            ) from exc
    return record_to_public(row)


async def update_service(
    user_id: int,
    service_id: int,
    payload: ServiceUpdate,
) -> ServicePublic:
    service_name = (
        _normalize_service_name(payload.service_name)
        if payload.service_name is not None
        else None
    )
    url = _normalize_url(payload.url) if payload.url is not None else None
    service_type = (
        _normalize_service_type(payload.service_type)
        if payload.service_type is not None
        else None
    )
    description_update = (
        _normalize_description(payload.description)
        if "description" in payload.model_fields_set
        else repository._UNSET
    )

    if (
        service_name is None
        and url is None
        and service_type is None
        and description_update is repository._UNSET
        and payload.check_enabled is None
        and payload.expected_status_code is None
        and payload.failure_threshold is None
    ):
        raise AppError("No fields to update.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_service_row(conn, user_id, service_id)
        try:
            row = await repository.update_service(
                conn,
                service_id,
                service_name=service_name,
                url=url,
                service_type=service_type,
                description=description_update,
                check_enabled=payload.check_enabled,
                expected_status_code=payload.expected_status_code,
                failure_threshold=payload.failure_threshold,
            )
        except UniqueViolationError as exc:
            raise AppError(
                "A service with this name and type already exists.",
                status_code=409,
            ) from exc
        if row is None:
            raise AppError("Service not found.", status_code=404)
    return record_to_public(row)


async def delete_service(user_id: int, service_id: int) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_service_row(conn, user_id, service_id)
        deleted = await repository.delete_service(conn, service_id)
    if not deleted:
        raise AppError("Service not found.", status_code=404)


async def check_service_now(user_id: int, service_id: int) -> ServicePublic:
    """Run an immediate health probe for one owned service."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await _get_owned_service_row(conn, user_id, service_id)
        return await probe_service_row(conn, row)
