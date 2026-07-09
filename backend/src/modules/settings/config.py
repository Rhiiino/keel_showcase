# keel_api/src/modules/settings/config.py
"""User settings module — constants used by router/service."""

FEATURE_KEY = "settings"
OPENAPI_TAG = "settings"

DEFAULT_GREETING_FONT_KEY = "default"

DEFAULT_HOME_GREETING_FONT_SIZE_PX = 36
MIN_HOME_GREETING_FONT_SIZE_PX = 20
MAX_HOME_GREETING_FONT_SIZE_PX = 72

DEFAULT_HOME_QUOTE_INTERVAL_SECONDS = 3
MIN_HOME_QUOTE_INTERVAL_SECONDS = 2
MAX_HOME_QUOTE_INTERVAL_SECONDS = 60

DEFAULT_NAV_BREADCRUMB_MAX_ENTRIES = 5
MIN_NAV_BREADCRUMB_MAX_ENTRIES = 1
MAX_NAV_BREADCRUMB_MAX_ENTRIES = 10

ALLOWED_GREETING_FONT_KEYS: frozenset[str] = frozenset(
    {
        "default",
        "serif",
        "mono",
        "rounded",
        "condensed",
        "handwritten",
        "display",
        "elegant",
        "slab",
        "bold",
        "retro",
        "tech",
        "classic",
        "wide",
    }
)
ROUTE_PREFIX = f"/{FEATURE_KEY}"

ROOT_PATH = ""

DEFAULT_SHELL_BACKGROUND_ENABLED = False

DEFAULT_HOME_SLIDESHOW_INTERVAL_SECONDS = 8
MIN_HOME_SLIDESHOW_INTERVAL_SECONDS = 2
MAX_HOME_SLIDESHOW_INTERVAL_SECONDS = 60
MAX_HOME_SLIDESHOW_MEDIA_IDS = 50

ALLOWED_HOME_CARD_IDS: frozenset[str] = frozenset(
    {
        "greeting",
        "quote",
        "slideshow",
        "journal-status",
        "today-timeline",
        "alive-timer",
    }
)


def default_home_card_visibility_all_hidden() -> dict[str, bool]:
    """Default visibility for newly registered users (all cards hidden)."""
    return {card_id: False for card_id in ALLOWED_HOME_CARD_IDS}
MAX_HOME_CARD_LAYOUT_COORD = 10_000
RESIZABLE_HOME_CARD_IDS: frozenset[str] = frozenset({"slideshow", "alive-timer"})
MIN_HOME_CARD_WIDTH = 240
MAX_HOME_CARD_WIDTH = 1_200
MIN_HOME_CARD_HEIGHT = 160
MAX_HOME_CARD_HEIGHT = 800
