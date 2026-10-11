# keel_api/src/modules/agents/config.py
"""Agents module settings — route paths (read-only catalog over llm/agents registry)."""

FEATURE_KEY = "agents"
OPENAPI_TAG = "agents"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

LIST_PATH = ""
AGENT_PATH = "/{agent_id}"
AGENT_SYSTEM_PROMPT_PATH = "/{agent_id}/system-prompt"
AGENT_CONTEXT_USAGE_PATH = "/{agent_id}/context-usage"
AGENT_PREFERENCES_PATH = "/{agent_id}/preferences"
