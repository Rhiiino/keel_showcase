# stack_sandbox/backend/src/modules/catalog/router.py

"""HTTP routes for the intelligence catalog (read + cache reload)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

from llm.catalog.storage import resolve_catalog_asset_path
from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.catalog import config, service
from modules.catalog.schemas import (
    AgentPublic,
    CatalogReloadResponse,
    ModalityPublic,
    ModelPublic,
    ProviderPublic,
    SystemPromptPublic,
    ToolCategoryPublic,
    ToolPublic,
)

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]


# GET /catalog/modalities
@router.get(config.MODALITIES_PATH, response_model=list[ModalityPublic])
async def list_modalities(user: CurrentUser) -> list[ModalityPublic]:
    """List catalog modalities from the in-memory cache."""
    return service.list_modalities()


# GET /catalog/providers
@router.get(config.PROVIDERS_PATH, response_model=list[ProviderPublic])
async def list_providers(user: CurrentUser) -> list[ProviderPublic]:
    """List catalog LLM providers from the in-memory cache."""
    return service.list_providers()


# GET /catalog/models
@router.get(config.MODELS_PATH, response_model=list[ModelPublic])
async def list_models(
    user: CurrentUser,
    modality_key: str | None = None,
) -> list[ModelPublic]:
    """List catalog models, optionally filtered by modality."""
    return service.list_models(modality_key=modality_key)


# GET /catalog/tool-categories
@router.get(config.TOOL_CATEGORIES_PATH, response_model=list[ToolCategoryPublic])
async def list_tool_categories(user: CurrentUser) -> list[ToolCategoryPublic]:
    """List catalog tool categories from the in-memory cache."""
    return service.list_tool_categories()


# GET /catalog/tools
@router.get(config.TOOLS_PATH, response_model=list[ToolPublic])
async def list_tools(user: CurrentUser) -> list[ToolPublic]:
    """List registered tool definitions from the catalog."""
    return service.list_tools()


# GET /catalog/system-prompts
@router.get(config.SYSTEM_PROMPTS_PATH, response_model=list[SystemPromptPublic])
async def list_system_prompts(user: CurrentUser) -> list[SystemPromptPublic]:
    """List catalog system prompt templates from the in-memory cache."""
    return service.list_system_prompts()


# GET /catalog/agents
@router.get(config.AGENTS_PATH, response_model=list[AgentPublic])
async def list_agents(user: CurrentUser) -> list[AgentPublic]:
    """List catalog agents from the in-memory cache."""
    return service.list_agents()


# GET /catalog/agents/{agent_id}
@router.get(f"{config.AGENTS_PATH}/{{agent_id}}", response_model=AgentPublic)
async def get_agent(agent_id: str, user: CurrentUser) -> AgentPublic:
    """Fetch one catalog agent by id."""
    return service.get_agent_public(agent_id)


# POST /catalog/reload
@router.post(config.RELOAD_PATH, response_model=CatalogReloadResponse)
async def reload_catalog(user: CurrentUser) -> CatalogReloadResponse:
    """Reload the catalog cache from the database."""
    return await service.reload_catalog()


# GET /catalog/media/{storage_key}
@router.get(config.MEDIA_FILE_PATH)
async def serve_catalog_media(storage_key: str) -> FileResponse:
    """Serve a catalog media asset by storage key."""
    path = resolve_catalog_asset_path(storage_key)
    return FileResponse(path, media_type=None, filename=path.name)
