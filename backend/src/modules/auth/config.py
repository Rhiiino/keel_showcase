# stack_sandbox/backend/src/modules/auth/config.py
"""Auth module settings — route paths (not app-wide env)."""

FEATURE_KEY = "auth"
OPENAPI_TAG = "auth"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

ME_PATH = "/me"
LOGOUT_PATH = "/logout"
SHOWCASE_LOGIN_PATH = "/showcase/login"
