# stack_sandbox/backend/src/modules/auth/config.py
"""Auth module settings — route paths and OAuth URLs (not app-wide env)."""

FEATURE_KEY = "auth"
OPENAPI_TAG = "auth"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

GOOGLE_LOGIN_PATH = "/google/login"
GOOGLE_CALLBACK_PATH = "/google/callback"
OAUTH_DISMISS_PATH = "/oauth/dismiss"
IOS_EXCHANGE_PATH = "/ios/exchange"
ME_PATH = "/me"
LOGOUT_PATH = "/logout"
DEV_USERS_PATH = "/dev/users"
DEV_LOGIN_PATH = "/dev/login"

GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
OAUTH_STATE_COOKIE_NAME = "keel_oauth_state"
OAUTH_STATE_MAX_AGE_SECONDS = 300
OAUTH_STATE_REDIRECT_SEPARATOR = "|"
IOS_POST_AUTH_REDIRECT_PREFIX = "keelauth://auth/"
