# stack_sandbox/backend/src/modules/subagents/schemas.py
"""Pydantic models for subagent catalog and system-prompt preview."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AgentMediaPublic(BaseModel):
    """Catalog media URL for an agent tile or 3D preview."""

    media_kind: str
    role: str | None = None
    mime_type: str
    url: str
    updated_at: str | None = None


class ToolSummary(BaseModel):
    """Tool metadata exposed in agent listings."""

    name: str
    category: str
    description: str


class AgentSummary(BaseModel):
    """Agent metadata from the code registry."""

    id: str
    display_name: str
    description: str
    system_prompt_key: str
    tool_categories: list[str]
    tools: list[ToolSummary]
    is_orchestrator: bool
    delegates_to: list[str]
    media: list[AgentMediaPublic] = []


class SystemPromptSectionPublic(BaseModel):
    key: str
    label: str | None = None
    content: str
    editable: bool = True


class AgentSystemPromptResponse(BaseModel):
    agent_id: str
    system_prompt: str
    sections: list[SystemPromptSectionPublic] = Field(default_factory=list)


class ToolTokenUsage(BaseModel):
    """Per-tool token estimate from the agent's tool manifest."""

    name: str
    category: str
    tokens: int


class AgentContextUsageResponse(BaseModel):
    agent_id: str
    provider: str
    model_id: str
    max_context_window: int
    system_prompt_tokens: int
    tools_tokens: int
    total_tokens: int
    tool_count: int
    tool_breakdown: list[ToolTokenUsage] = Field(default_factory=list)
    is_estimate: bool


class AgentLlmPreferencesPublic(BaseModel):
    agent_id: str
    provider: str
    model_id: str
    max_context_window: int
    has_override: bool


class AgentLlmPreferencesUpdate(BaseModel):
    provider: str = Field(..., min_length=1, max_length=64)
    model_id: str = Field(..., min_length=1, max_length=128)


class AgentUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    tool_categories: list[str] | None = None


class AgentSystemPromptCreate(BaseModel):
    identity: str = Field(..., min_length=1)
    purpose: str = Field(..., min_length=1)
    guidelines: str = Field(..., min_length=1)
    domain_reference: str = Field(..., min_length=1)
    tool_guidance: str | None = None
    safety: str = Field(..., min_length=1)


class AgentCreate(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    tool_categories: list[str] = Field(..., min_length=1)
    system_prompt: AgentSystemPromptCreate


class SystemPromptSectionUpdate(BaseModel):
    key: str = Field(..., min_length=1, max_length=64)
    content: str


class AgentSystemPromptUpdate(BaseModel):
    sections: list[SystemPromptSectionUpdate] = Field(default_factory=list)
