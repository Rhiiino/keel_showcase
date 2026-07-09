# stack_sandbox/backend/src/modules/chat/router.py
"""HTTP routes for chat conversations and messages (all require a session)."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.chat import config, service
from modules.chat.schemas import (
    ChatPreferencesPublic,
    ChatPreferencesUpdate,
    ChatRuleCreate,
    ChatRulePublic,
    ChatRuleUpdate,
    ConversationCreate,
    ConversationPublic,
    ConversationReorder,
    ConversationUpdate,
    MessageCreate,
    MessagePublic,
    MessageUpdate,
    ModelProviderGroup,
    StreamRequest,
)

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]


# ----- Conversations
# GET /chat/conversations
@router.get(config.CONVERSATIONS_PATH, response_model=list[ConversationPublic])
async def list_conversations(
    user: CurrentUser,
    global_only: bool = False,
    project_id: int | None = None,
) -> list[ConversationPublic]:
    """List the current user's conversations in manual sort order."""
    return await service.list_conversations(
        user.id, global_only=global_only, project_id=project_id
    )


# PUT /chat/conversations/reorder
@router.put(config.CONVERSATIONS_REORDER_PATH, response_model=list[ConversationPublic])
async def reorder_conversations(
    payload: ConversationReorder,
    user: CurrentUser,
) -> list[ConversationPublic]:
    """Persist a new manual order for conversations in a list scope."""
    return await service.reorder_conversations(user.id, payload)


# POST /chat/conversations
@router.post(
    config.CONVERSATIONS_PATH,
    response_model=ConversationPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    payload: ConversationCreate,
    user: CurrentUser,
) -> ConversationPublic:
    """Create a new conversation owned by the current user."""
    return await service.create_conversation(user.id, payload)


# GET /chat/conversations/{conversation_id}
@router.get(config.CONVERSATION_BY_ID_PATH, response_model=ConversationPublic)
async def get_conversation(conversation_id: int, user: CurrentUser) -> ConversationPublic:
    """Fetch one conversation owned by the current user."""
    return await service.get_conversation(user.id, conversation_id)


# PATCH /chat/conversations/{conversation_id}
@router.patch(config.CONVERSATION_BY_ID_PATH, response_model=ConversationPublic)
async def update_conversation(
    conversation_id: int,
    payload: ConversationUpdate,
    user: CurrentUser,
) -> ConversationPublic:
    """Rename a conversation."""
    return await service.update_conversation(user.id, conversation_id, payload)


# DELETE /chat/conversations/{conversation_id}
@router.delete(config.CONVERSATION_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(conversation_id: int, user: CurrentUser) -> None:
    """Delete a conversation and its messages."""
    await service.delete_conversation(user.id, conversation_id)


# ----- Models + preferences
# GET /chat/models
@router.get(config.MODELS_PATH, response_model=list[ModelProviderGroup])
async def list_models(user: CurrentUser) -> list[ModelProviderGroup]:
    """List registered LLM models grouped by provider."""
    return service.list_models()


# GET /chat/preferences
@router.get(config.PREFERENCES_PATH, response_model=ChatPreferencesPublic)
async def get_preferences(user: CurrentUser) -> ChatPreferencesPublic:
    """Return the current user's resolved LLM provider and model."""
    return await service.get_preferences(user.id)


# PATCH /chat/preferences
@router.patch(config.PREFERENCES_PATH, response_model=ChatPreferencesPublic)
async def update_preferences(
    payload: ChatPreferencesUpdate,
    user: CurrentUser,
) -> ChatPreferencesPublic:
    """Update the current user's LLM provider and model."""
    return await service.update_preferences(user.id, payload)


# ----- Messages
# GET /chat/conversations/{conversation_id}/messages
@router.get(config.MESSAGES_PATH, response_model=list[MessagePublic])
async def list_messages(conversation_id: int, user: CurrentUser) -> list[MessagePublic]:
    """List messages in a conversation, oldest first."""
    return await service.list_messages(user.id, conversation_id)


# POST /chat/conversations/{conversation_id}/messages
@router.post(
    config.MESSAGES_PATH,
    response_model=MessagePublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_message(
    conversation_id: int,
    payload: MessageCreate,
    user: CurrentUser,
) -> MessagePublic:
    """Create a user message in a conversation."""
    return await service.create_message(user.id, conversation_id, payload)


# GET /chat/conversations/{conversation_id}/messages/{message_id}
@router.get(config.MESSAGE_BY_ID_PATH, response_model=MessagePublic)
async def get_message(
    conversation_id: int,
    message_id: int,
    user: CurrentUser,
) -> MessagePublic:
    """Fetch one message in a conversation."""
    return await service.get_message(user.id, conversation_id, message_id)


# PATCH /chat/conversations/{conversation_id}/messages/{message_id}
@router.patch(config.MESSAGE_BY_ID_PATH, response_model=MessagePublic)
async def update_message(
    conversation_id: int,
    message_id: int,
    payload: MessageUpdate,
    user: CurrentUser,
) -> MessagePublic:
    """Edit the content of a user message."""
    return await service.update_message(user.id, conversation_id, message_id, payload)


# DELETE /chat/conversations/{conversation_id}/messages/{message_id}
@router.delete(config.MESSAGE_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    conversation_id: int,
    message_id: int,
    user: CurrentUser,
) -> None:
    """Delete a message from a conversation."""
    await service.delete_message(user.id, conversation_id, message_id)


# ----- Streaming (primary completion path)
# POST /chat/conversations/{conversation_id}/stream
@router.post(config.STREAM_PATH)
async def stream_turn(
    conversation_id: int,
    payload: StreamRequest,
    user: CurrentUser,
) -> StreamingResponse:
    """Stream a Keel-orchestrated assistant turn as Server-Sent Events."""
    # Surface ownership errors as JSON before the stream starts.
    await service.get_conversation(user.id, conversation_id)
    return StreamingResponse(
        service.stream_turn(user, conversation_id, payload),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ----- Chat rules
# GET /chat/rules
@router.get(config.RULES_PATH, response_model=list[ChatRulePublic])
async def list_rules(user: CurrentUser) -> list[ChatRulePublic]:
    """List all chat rules for the current user."""
    return await service.list_rules(user.id)


# POST /chat/rules
@router.post(
    config.RULES_PATH,
    response_model=ChatRulePublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_rule(payload: ChatRuleCreate, user: CurrentUser) -> ChatRulePublic:
    """Create a new chat rule."""
    return await service.create_rule(user.id, payload)


# PATCH /chat/rules/{rule_id}
@router.patch(config.RULE_BY_ID_PATH, response_model=ChatRulePublic)
async def update_rule(
    rule_id: int,
    payload: ChatRuleUpdate,
    user: CurrentUser,
) -> ChatRulePublic:
    """Update a chat rule."""
    return await service.update_rule(user.id, rule_id, payload)


# DELETE /chat/rules/{rule_id}
@router.delete(config.RULE_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(rule_id: int, user: CurrentUser) -> None:
    """Delete a chat rule."""
    await service.delete_rule(user.id, rule_id)
