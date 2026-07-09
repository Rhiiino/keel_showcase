# keel_api/src/modules/deleted/router.py
"""HTTP routes for recently-deleted trash rows."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.deleted import config, service
from modules.deleted.schemas import (
    DeletedConfigPublic,
    DeletedRecordDetailPublic,
    DeletedRecordPublic,
    DeletedRestoreResultPublic,
)

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]



# ----- Config
@router.get(config.CONFIG_PATH, response_model=DeletedConfigPublic)
async def get_deleted_config(user: CurrentUser) -> DeletedConfigPublic:
    del user
    return await service.get_deleted_config()



# ----- Trash rows
@router.get(config.ROOT_PATH, response_model=list[DeletedRecordPublic])
async def list_deleted_records(
    user: CurrentUser,
    entity_type: str | None = Query(default=None),
) -> list[DeletedRecordPublic]:
    return await service.list_deleted_records(user.id, entity_type=entity_type)


@router.get(config.RECORD_BY_ID_PATH, response_model=DeletedRecordDetailPublic)
async def get_deleted_record(user: CurrentUser, record_id: UUID) -> DeletedRecordDetailPublic:
    return await service.get_deleted_record(user.id, record_id)


@router.post(
    config.RESTORE_PATH,
    response_model=DeletedRestoreResultPublic,
)
async def restore_deleted_record(
    user: CurrentUser,
    record_id: UUID,
) -> DeletedRestoreResultPublic:
    return await service.restore_deleted_record(user.id, record_id)


@router.delete(config.RECORD_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def purge_deleted_record(user: CurrentUser, record_id: UUID) -> None:
    await service.purge_deleted_record(user.id, record_id)
