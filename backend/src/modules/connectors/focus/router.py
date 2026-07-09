# keel_api/src/modules/connectors/focus/router.py

"""HTTP routes for the Focus external connector."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.connectors.auth import ConnectorSession, require_focus_connector_session
from modules.connectors.focus import config, service
from modules.connectors.realtime import subscribe_connector_events
from modules.connectors.schemas import (
    ConnectorSessionCreate,
    ConnectorSessionCreated,
    ConnectorSessionPublic,
    ConnectorToolInvokeRequest,
    ConnectorToolInvokeResponse,
)

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]
FocusConnectorSession = Annotated[ConnectorSession, Depends(require_focus_connector_session)]



# ----- Manifest
@router.get(config.MANIFEST_PATH)
async def get_focus_connector_manifest() -> dict[str, Any]:
    """Return the Focus connector manifest for external LLMs."""
    return service.get_focus_manifest()


@router.get(config.GUIDE_PATH)
async def get_focus_connector_guide() -> dict[str, str]:
    """Return the Focus connector LLM guide as markdown."""
    return service.get_focus_connector_guide()



# ----- Sessions
@router.post(
    config.SESSIONS_PATH,
    response_model=ConnectorSessionCreated,
    status_code=status.HTTP_201_CREATED,
)
async def create_focus_connector_session(
    payload: ConnectorSessionCreate,
    user: CurrentUser,
) -> ConnectorSessionCreated:
    """Create a short-lived Focus connector session and return the bearer token once."""
    return await service.create_focus_connector_session(user.id, payload)


@router.get(config.SESSION_CURRENT_PATH, response_model=ConnectorSessionPublic | None)
async def get_focus_connector_session(user: CurrentUser) -> ConnectorSessionPublic | None:
    """Return the active Focus connector session for the current user, if any."""
    return service.get_focus_connector_session(user.id)


@router.delete(config.SESSION_CURRENT_PATH, response_model=ConnectorSessionPublic | None)
async def revoke_focus_connector_session(user: CurrentUser) -> ConnectorSessionPublic | None:
    """Revoke the active Focus connector session for the current user."""
    return await service.revoke_focus_connector_session(user.id)



# ----- Realtime events
@router.get(config.EVENTS_PATH)
async def stream_focus_connector_events(user: CurrentUser) -> StreamingResponse:
    """Stream Focus automation events for the constellation page."""
    return StreamingResponse(
        subscribe_connector_events(user_id=user.id, connector=config.CONNECTOR_KEY),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )



# ----- Tool invocation
@router.post(
    config.TOOL_INVOKE_PATH,
    response_model=ConnectorToolInvokeResponse,
)
async def invoke_focus_connector_tool(
    tool_name: str,
    payload: ConnectorToolInvokeRequest,
    session: FocusConnectorSession,
) -> ConnectorToolInvokeResponse:
    """Invoke one Focus connector tool using a bearer token."""
    return await service.invoke_focus_tool(session, tool_name, payload)
