# stack_sandbox/backend/src/modules/home/router.py
"""HTTP routes for home screen content (session required)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.home import config, service
from modules.home.schemas import QuotePublic

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]



# ----- Quotes
# GET /home/quotes
@router.get(config.QUOTES_PATH, response_model=list[QuotePublic])
async def list_quotes(user: CurrentUser) -> list[QuotePublic]:
    """Return all inspirational quotes for the home screen rotator."""
    return await service.list_quotes()
