# keel_api/src/modules/connectors/config.py

"""Shared connector route constants and scope names."""

FEATURE_KEY = "connectors"
OPENAPI_TAG = "connectors"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

SCOPE_FOCUS_READ = "focus:read"
SCOPE_FOCUS_WRITE = "focus:write"
SCOPE_FOCUS_DELETE = "focus:delete"

DEFAULT_FOCUS_SCOPES: frozenset[str] = frozenset(
    {
        SCOPE_FOCUS_READ,
        SCOPE_FOCUS_WRITE,
        SCOPE_FOCUS_DELETE,
    }
)
