# keel_api/src/modules/coak/service/configuration_settings.py

"""Per-record Coak configuration settings on coak_records."""

from __future__ import annotations

from core.database import get_pool
from core.errors import AppError
from modules.coak.repository import records as records_repository
from modules.coak.schemas import (
    CoakConfigurationSettingsPublic,
    CoakConfigurationSettingsUpdate,
)
from modules.coak.service.helpers import assert_owned_record



def empty_configuration_settings(*, persisted: bool = False) -> CoakConfigurationSettingsPublic:
    return CoakConfigurationSettingsPublic(settings={}, persisted=persisted)


def configuration_settings_from_column_data(raw: object) -> CoakConfigurationSettingsPublic:
    if not isinstance(raw, dict):
        return empty_configuration_settings()
    return CoakConfigurationSettingsPublic(
        settings=dict(raw),
        persisted=True,
    )


async def get_configuration_settings(
    user_id: int,
    record_id: int,
) -> CoakConfigurationSettingsPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        await assert_owned_record(conn, user_id=user_id, record_id=record_id)
        record_data = await records_repository.get_configuration_settings(
            conn,
            user_id=user_id,
            record_id=record_id,
        )
    if not record_data:
        return empty_configuration_settings(persisted=False)
    return configuration_settings_from_column_data(record_data)


async def update_configuration_settings(
    user_id: int,
    record_id: int,
    payload: CoakConfigurationSettingsUpdate,
) -> CoakConfigurationSettingsPublic:
    settings = CoakConfigurationSettingsPublic(
        settings=dict(payload.settings),
        persisted=True,
    )

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await assert_owned_record(conn, user_id=user_id, record_id=record_id)
            updated = await records_repository.update_configuration_settings(
                conn,
                user_id=user_id,
                record_id=record_id,
                configuration_settings=settings.settings,
            )
            if updated is None:
                raise AppError("Coak record not found.", status_code=404)

    return settings
