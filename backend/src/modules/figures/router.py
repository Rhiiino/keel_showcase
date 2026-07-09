# keel_api/src/modules/figures/router.py

"""HTTP routes for figures (session required)."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import Response

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.figures import config, service
from modules.figures.schemas import FigureCreate, FigurePublic, FigureUpdate

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]



# ----- Figures
@router.get(config.LIST_FIGURES_PATH, response_model=list[FigurePublic])
async def list_figures(user: CurrentUser) -> list[FigurePublic]:
    """List figures for the current user."""
    return await service.list_figures(user.id)


@router.post(
    config.LIST_FIGURES_PATH,
    response_model=FigurePublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_figure(
    payload: FigureCreate,
    user: CurrentUser,
) -> FigurePublic:
    """Create a new figure."""
    return await service.create_figure(user.id, payload)


@router.get(config.FIGURE_BY_ID_PATH, response_model=FigurePublic)
async def get_figure(figure_id: int, user: CurrentUser) -> FigurePublic:
    """Fetch one figure."""
    return await service.get_figure(user.id, figure_id)


@router.patch(config.FIGURE_BY_ID_PATH, response_model=FigurePublic)
async def update_figure(
    figure_id: int,
    payload: FigureUpdate,
    user: CurrentUser,
) -> FigurePublic:
    """Update one figure."""
    return await service.update_figure(user.id, figure_id, payload)


@router.delete(config.FIGURE_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_figure(figure_id: int, user: CurrentUser) -> Response:
    """Delete one figure."""
    await service.delete_figure(user.id, figure_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
