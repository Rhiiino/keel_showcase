# stack_sandbox/backend/src/modules/chat/schemas.py
"""Pydantic models for chat conversations and messages."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class MessageRole(str, Enum):
    """Author of a message. Clients may only create `user` messages."""

    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class ConversationPublic(BaseModel):
    id: int
    user_id: int
    title: str | None = None
    driver_agent_id: str = "keel"
    project_id: int | None = None
    sort_order: int = 0
    created_at: datetime
    updated_at: datetime


class ConversationCreate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    driver_agent_id: str = "keel"
    project_id: int | None = None


class ConversationUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)


class ConversationReorder(BaseModel):
    conversation_ids: list[int] = Field(..., min_length=1)
    global_only: bool = False
    project_id: int | None = None


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)


class MessageUpdate(BaseModel):
    content: str = Field(..., min_length=1)


class ToolCallPublic(BaseModel):
    """Tool invocation linked to an assistant message."""

    id: int
    tool_name: str
    category: str | None = None
    call_order: int
    duration_seconds: float | None = None
    success: bool | None = None


class MessagePublic(BaseModel):
    id: int
    conversation_id: int
    role: MessageRole
    content: str
    agent_id: str | None = None
    agents_used: list[str] = Field(default_factory=list)
    provider: str | None = None
    model: str | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    tool_calls: list[ToolCallPublic] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class StreamRequest(BaseModel):
    """Body for the streaming turn endpoint."""

    content: str = Field(..., min_length=1)
    canvas_context: dict | None = None


class ModelPublic(BaseModel):
    id: str
    provider: str
    display_name: str
    max_context_window: int | None = None
    input_price_per_1m: float | None = None
    output_price_per_1m: float | None = None


class ModelProviderGroup(BaseModel):
    provider: str
    models: list[ModelPublic]


class ChatPreferencesPublic(BaseModel):
    provider: str
    model_id: str
    max_context_window: int | None = None


class ChatPreferencesUpdate(BaseModel):
    provider: str = Field(..., min_length=1, max_length=64)
    model_id: str = Field(..., min_length=1, max_length=128)


class ChatRulePublic(BaseModel):
    id: int
    title: str
    content: str
    agent_ids: list[str]
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime


class ChatRuleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    agent_ids: list[str] = Field(..., min_length=1)
    is_active: bool = True


class ChatRuleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1)
    agent_ids: list[str] | None = Field(default=None, min_length=1)
    is_active: bool | None = None
    sort_order: int | None = None
