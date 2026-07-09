# keel_api/src/modules/games/config.py

"""Games module constants — routes and registered game keys."""

from __future__ import annotations

FEATURE_KEY = "games"
OPENAPI_TAG = "games"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

SESSIONS_PATH = "/sessions"
SESSION_RESUME_PATH = "/sessions/resume"
SESSION_ACTIVE_PATH = "/sessions/active"
SESSION_BY_ID_PATH = "/sessions/{session_id}"
SESSION_COMPLETE_PATH = "/sessions/{session_id}/complete"
SESSION_RESTART_PATH = "/sessions/{session_id}/restart"
STATS_PATH = "/stats"

REGISTERED_GAME_KEYS = frozenset({"tower-of-hanoi"})
