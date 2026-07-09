# keel_api/src/modules/connectors/focus/config.py

"""Focus connector route constants."""

CONNECTOR_KEY = "focus"
OPENAPI_TAG = "connectors-focus"
ROUTE_PREFIX = f"/{CONNECTOR_KEY}"

MANIFEST_PATH = "/manifest"
GUIDE_PATH = "/guide"
SESSIONS_PATH = "/sessions"
SESSION_CURRENT_PATH = "/sessions/current"
EVENTS_PATH = "/events"
TOOL_INVOKE_PATH = "/tools/{tool_name}/invoke"
