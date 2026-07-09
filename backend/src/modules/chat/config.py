# stack_sandbox/backend/src/modules/chat/config.py
"""Chat module settings — route paths and module-local defaults (not app-wide env)."""

FEATURE_KEY = "chat"
OPENAPI_TAG = "chat"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

# Route paths relative to ROUTE_PREFIX (kept here so router/service stay in sync)
CONVERSATIONS_PATH = "/conversations"
CONVERSATIONS_REORDER_PATH = "/conversations/reorder"
CONVERSATION_BY_ID_PATH = "/conversations/{conversation_id}"
MESSAGES_PATH = "/conversations/{conversation_id}/messages"
MESSAGE_BY_ID_PATH = "/conversations/{conversation_id}/messages/{message_id}"
STREAM_PATH = "/conversations/{conversation_id}/stream"
RULES_PATH = "/rules"
RULE_BY_ID_PATH = "/rules/{rule_id}"
MODELS_PATH = "/models"
PREFERENCES_PATH = "/preferences"

# Default title applied when a conversation is created without one.
DEFAULT_CONVERSATION_TITLE = "New conversation"
