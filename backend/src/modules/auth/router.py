# stack_sandbox/backend/src/modules/auth/router.py
"""HTTP routes for Google OAuth and session auth."""

import json
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import HTMLResponse, RedirectResponse

from core.config import get_settings
from core.errors import AppError
from modules.auth import config, service
from modules.auth.schemas import (
    CurrentUserResponse,
    MobileExchangeRequest,
    MobileExchangeResponse,
    UpdateCurrentUserRequest,
)

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])


# GET /auth/google/login
@router.get(config.GOOGLE_LOGIN_PATH)
async def start_google_login(redirect: str | None = None) -> RedirectResponse:
    """Redirect browser to Google OAuth; sets short-lived CSRF state cookie."""
    post_auth_redirect = service.validate_post_auth_redirect(redirect)
    state = service.create_oauth_state()
    response = RedirectResponse(service.build_google_authorization_url(state))
    service.set_oauth_state_cookie(response, state, post_auth_redirect)
    return response


# GET /auth/google/callback
@router.get(config.GOOGLE_CALLBACK_PATH)
async def handle_google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
) -> RedirectResponse:
    """Exchange OAuth code, upsert user, enforce session cap, set session cookie."""
    if error:
        raise AppError(error, status_code=400)

    expected_state, stored_redirect = service.unpack_oauth_state_cookie(
        request.cookies.get(config.OAUTH_STATE_COOKIE_NAME)
    )
    if not code or not state or not expected_state or state != expected_state:
        raise AppError("Invalid OAuth callback state.", status_code=400)

    google_user = await service.exchange_google_code_for_user(code)
    session_token, _expires_at = await service.create_login_session(
        google_user=google_user,
        request=request,
    )

    settings = get_settings()
    post_auth_redirect = service.validate_post_auth_redirect(stored_redirect)
    if post_auth_redirect:
        exchange_code = service.store_mobile_exchange_code(session_token)
        destination = service.build_ios_oauth_dismiss_url(
            post_auth_redirect,
            exchange_code,
        )
    else:
        destination = settings.frontend_url
    response = RedirectResponse(destination)
    service.set_session_cookie(response, session_token)
    service.clear_oauth_state_cookie(response)
    return response


# GET /auth/oauth/dismiss
@router.get(config.OAUTH_DISMISS_PATH)
async def oauth_dismiss(target: str | None = None) -> HTMLResponse:
    """Load session cookie on HTTPS, then redirect to the iOS custom URL scheme."""
    redirect_target = service.validate_post_auth_redirect(target)
    if not redirect_target:
        raise AppError("Invalid dismiss target.", status_code=400)

    target_json = json.dumps(redirect_target)
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url={redirect_target}">
  <title>Signing in…</title>
  <script>location.replace({target_json});</script>
</head>
<body></body>
</html>"""
    return HTMLResponse(html)


# POST /auth/ios/exchange
@router.post(config.IOS_EXCHANGE_PATH, response_model=MobileExchangeResponse)
async def exchange_mobile_session(body: MobileExchangeRequest) -> MobileExchangeResponse:
    """Exchange a one-time iOS OAuth code for a session token and current user."""
    session_token = service.consume_mobile_exchange_code(body.code)
    if not session_token:
        raise AppError("Invalid or expired exchange code.", status_code=400)

    user = await service.get_current_user_for_session_token(session_token)
    return MobileExchangeResponse(session_token=session_token, user=user)


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

