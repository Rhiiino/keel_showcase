# keel_api/src/modules/services/router.py

"""HTTP routes for service health monitors (session required)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.services import config, service
from modules.services.schemas import ServiceCreate, ServicePublic, ServiceUpdate

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]



# ----- Services
@router.get(config.LIST_PATH, response_model=list[ServicePublic])
async def list_services(user: CurrentUser) -> list[ServicePublic]:
    """List the current user's monitored services."""
    return await service.list_services(user.id)


@router.post(
    config.LIST_PATH,
    response_model=ServicePublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_service(
    payload: ServiceCreate,
    user: CurrentUser,
) -> ServicePublic:
    """Create a monitored service."""
    return await service.create_service(user.id, payload)


@router.get(config.SERVICE_BY_ID_PATH, response_model=ServicePublic)
async def get_service(service_id: int, user: CurrentUser) -> ServicePublic:
    """Return one monitored service."""
    return await service.get_service(user.id, service_id)


@router.patch(config.SERVICE_BY_ID_PATH, response_model=ServicePublic)
async def update_service(
    service_id: int,
    payload: ServiceUpdate,
    user: CurrentUser,
) -> ServicePublic:
    """Update one monitored service."""
    return await service.update_service(user.id, service_id, payload)


@router.delete(config.SERVICE_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(service_id: int, user: CurrentUser) -> None:
    """Delete one monitored service."""
    await service.delete_service(user.id, service_id)


@router.post(config.SERVICE_CHECK_PATH, response_model=ServicePublic)
async def check_service(service_id: int, user: CurrentUser) -> ServicePublic:
    """Run an immediate health check for one service."""
    return await service.check_service_now(user.id, service_id)
