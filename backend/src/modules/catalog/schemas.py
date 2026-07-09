# stack_sandbox/backend/src/modules/catalog/schemas.py

"""Pydantic models for catalog read APIs."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class CatalogMediaPublic(BaseModel):
    id: int
    media_kind: str
    role: str | None = None
    mime_type: str
    url: str
    sort_order: int = 0


class ModalityPublic(BaseModel):
    key: str
    display_name: str
    description: str
    sort_order: int


class ProviderPublic(BaseModel):
    key: str
    display_name: str
    base_url: str | None = None
    is_enabled: bool
    sort_order: int
    config: dict[str, Any] = Field(default_factory=dict)
    media: list[CatalogMediaPublic] = Field(default_factory=list)


class ModelPublic(BaseModel):
    id: str
    provider: str
    modality_key: str
    display_name: str
    max_context_window: int | None = None
    input_price_per_1m: float | None = None
    output_price_per_1m: float | None = None
    capabilities: dict[str, Any] = Field(default_factory=dict)
    is_enabled: bool
    is_provider_default: bool
    sort_order: int
    media: list[CatalogMediaPublic] = Field(default_factory=list)


class ToolCategoryPublic(BaseModel):
    key: str
    display_name: str
    description: str
    sort_order: int
    media: list[CatalogMediaPublic] = Field(default_factory=list)


class ToolPublic(BaseModel):
    name: str
    category: str
    description: str
    parameters: dict[str, Any]
    returns: str
    examples: list[str] | None = None
    is_enabled: bool


class SystemPromptPublic(BaseModel):
    key: str
    display_name: str
    identity: str
    purpose: str | None = None
    guidelines: str | None = None
    domain_reference: str | None = None
    tool_guidance: str | None = None
    safety: str | None = None
    sort_order: int


class AgentPublic(BaseModel):
    id: str
    display_name: str
    description: str
    system_prompt_key: str
    tool_categories: list[str]
    is_orchestrator: bool
    is_enabled: bool
    delegates_to: list[str]
    sort_order: int
    media: list[CatalogMediaPublic] = Field(default_factory=list)


class CatalogReloadResponse(BaseModel):
    status: str = "ok"
    agents: int
    tools: int
    models: int
    providers: int
