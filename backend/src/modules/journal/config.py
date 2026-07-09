# keel_api/src/modules/journal/config.py

"""Journal module settings — route paths and constants."""

FEATURE_KEY = "journal"
OPENAPI_TAG = "journal"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

ENTRIES_PATH = "/entries"
ENTRY_BY_ID_PATH = "/entries/{entry_id}"
TAG_LIST_PATH = "/tags"
TAG_BY_ID_PATH = "/tags/{tag_id}"

DEFAULT_TAG_COLOR_HEX = "#06B6D4"
