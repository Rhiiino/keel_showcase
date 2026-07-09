# stack_sandbox/backend/src/modules/preferences/router.py
"""HTTP routes for per-user cross-frontend UI preferences."""

from typing import Annotated

from fastapi import APIRouter, Depends

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.settings import config, service
from modules.settings.schemas import UserSettingsPatch, UserSettingsPublic

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]



# ----- Preferences
# GET /settings
@router.get(config.ROOT_PATH, response_model=UserSettingsPublic)
async def get_settings(user: CurrentUser) -> UserSettingsPublic:
    """Return the current user's stored UI settings."""
    return await service.get_settings(user.id)


# PATCH /settings
@router.patch(config.ROOT_PATH, response_model=UserSettingsPublic)
async def patch_settings(
    payload: UserSettingsPatch,
    user: CurrentUser,
) -> UserSettingsPublic:
    """Merge a partial settings update for the current user."""
    return await service.patch_settings(user.id, payload)
