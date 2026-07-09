# stack_sandbox/backend/src/modules/subagents/router.py
"""HTTP routes for subagent catalog, admin writes, and system-prompt preview (session required)."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.agents import config, service
from modules.agents.schemas import (
    AgentContextUsageResponse,
    AgentLlmPreferencesPublic,
    AgentLlmPreferencesUpdate,
    AgentSummary,
    AgentSystemPromptResponse,
    AgentSystemPromptUpdate,
    AgentUpdate,
)

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]


# POST /agents
@router.post(config.LIST_PATH, response_model=AgentSummary, status_code=status.HTTP_201_CREATED)
async def create_agent(
    user: CurrentUser,
    payload: str = Form(...),
    tile_image: UploadFile = File(...),
    model_3d: UploadFile | None = File(default=None),
) -> AgentSummary:
    """Create a sub-agent with prompt sections, tool grants, media, and Keel delegation."""
    create_payload = service.parse_agent_create_payload(payload)
    return await service.create_agent_for_user(
        create_payload,
        tile_image=tile_image,
        model_3d=model_3d,
    )


# GET /subagents
@router.get(config.LIST_PATH, response_model=list[AgentSummary])
async def list_agents(user: CurrentUser) -> list[AgentSummary]:
    """List registered agents and their tool/delegation metadata."""
    return service.list_agent_summaries()


# PATCH /subagents/{agent_id}
@router.patch(config.AGENT_PATH, response_model=AgentSummary)
async def update_agent(
    agent_id: str,
    payload: AgentUpdate,
    user: CurrentUser,
) -> AgentSummary:
    """Update agent display metadata and/or assigned tool categories."""
    return await service.update_agent_for_user(agent_id, payload)


# GET /subagents/{agent_id}/system-prompt
@router.get(config.AGENT_SYSTEM_PROMPT_PATH, response_model=AgentSystemPromptResponse)
async def get_agent_system_prompt(
    agent_id: str,
    user: CurrentUser,
) -> AgentSystemPromptResponse:
    """Preview the composed system prompt for an agent (includes user chat rules)."""
    return await service.get_agent_system_prompt_for_user(user.id, agent_id)


# PATCH /subagents/{agent_id}/system-prompt
@router.patch(config.AGENT_SYSTEM_PROMPT_PATH, response_model=AgentSystemPromptResponse)
async def update_agent_system_prompt(
    agent_id: str,
    payload: AgentSystemPromptUpdate,
    user: CurrentUser,
) -> AgentSystemPromptResponse:
    """Update DB-backed system prompt sections for an agent."""
    return await service.update_agent_system_prompt_for_user(user.id, agent_id, payload)


# GET /subagents/{agent_id}/context-usage
@router.get(config.AGENT_CONTEXT_USAGE_PATH, response_model=AgentContextUsageResponse)
async def get_agent_context_usage(
    agent_id: str,
    user: CurrentUser,
) -> AgentContextUsageResponse:
    """Estimate input tokens for an agent's system prompt and tool definitions."""
    return await service.get_agent_context_usage_for_user(user.id, agent_id)


# GET /subagents/{agent_id}/preferences
@router.get(config.AGENT_PREFERENCES_PATH, response_model=AgentLlmPreferencesPublic)
async def get_agent_llm_preferences(
    agent_id: str,
    user: CurrentUser,
) -> AgentLlmPreferencesPublic:
    """Read effective LLM provider/model for a sub-agent (includes inherited global default)."""
    return await service.get_agent_llm_preferences_for_user(user.id, agent_id)


# PATCH /subagents/{agent_id}/preferences
@router.patch(config.AGENT_PREFERENCES_PATH, response_model=AgentLlmPreferencesPublic)
async def update_agent_llm_preferences(
    agent_id: str,
    payload: AgentLlmPreferencesUpdate,
    user: CurrentUser,
) -> AgentLlmPreferencesPublic:
    """Save per-sub-agent LLM provider/model override."""
    return await service.update_agent_llm_preferences_for_user(user.id, agent_id, payload)


# DELETE /subagents/{agent_id}/preferences
@router.delete(config.AGENT_PREFERENCES_PATH, response_model=AgentLlmPreferencesPublic)
async def delete_agent_llm_preferences(
    agent_id: str,
    user: CurrentUser,
) -> AgentLlmPreferencesPublic:
    """Clear override so the sub-agent inherits global chat preferences."""
    return await service.clear_agent_llm_preferences_for_user(user.id, agent_id)


# PATCH /agents/{agent_id}/media
@router.patch(config.AGENT_MEDIA_PATH, response_model=AgentSummary)
async def update_agent_media(
    agent_id: str,
    user: CurrentUser,
    tile_image: UploadFile | None = File(default=None),
    model_3d: UploadFile | None = File(default=None),
) -> AgentSummary:
    """Replace an agent portrait and/or optional turntable GLB model."""
    return await service.update_agent_media_for_user(
        agent_id,
        tile_image=tile_image,
        model_3d=model_3d,
    )
