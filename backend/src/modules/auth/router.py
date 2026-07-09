# backend/src/modules/auth/router.py
"""HTTP routes for showcase session auth."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status

from core.config import get_settings
from modules.auth import config, service
from modules.auth.schemas import CurrentUserResponse, UpdateCurrentUserRequest

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])


# POST /auth/showcase/login
@router.post(config.SHOWCASE_LOGIN_PATH, response_model=CurrentUserResponse)
async def showcase_login(request: Request, response: Response) -> CurrentUserResponse:
    """Create a session for the shared showcase demo user."""
    settings = get_settings()
    session_token, user = await service.create_session_for_user(
        user_id=settings.showcase_user_id,
        request=request,
    )
    service.set_session_cookie(response, session_token)
    return user


# GET /auth/me
@router.get(config.ME_PATH, response_model=CurrentUserResponse)
async def read_current_user(
    user: Annotated[CurrentUserResponse, Depends(service.get_current_user)],
) -> CurrentUserResponse:
    """Return the logged-in user from the session cookie."""
    return user


# PATCH /auth/me
@router.patch(config.ME_PATH, response_model=CurrentUserResponse)
async def patch_current_user(
    payload: UpdateCurrentUserRequest,
    user: Annotated[CurrentUserResponse, Depends(service.get_current_user)],
) -> CurrentUserResponse:
    """Update the current user's profile (display name and/or picture URL)."""
    return await service.update_current_user(user.id, payload)


# POST /auth/logout
@router.post(config.LOGOUT_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response) -> None:
    """Invalidate the current session and clear the session cookie."""
    await service.logout_current_session(request, response)
