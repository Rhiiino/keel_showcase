# keel_api/src/modules/focus/config.py

"""Focus module settings — route paths and defaults."""

FEATURE_KEY = "focus"
OPENAPI_TAG = "focus"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

NODE_LIST_PATH = "/nodes"
NODE_BY_ID_PATH = "/nodes/{node_id}"
NODE_COMPLETE_PATH = "/nodes/{node_id}/complete"
NODE_REORDER_PATH = "/nodes/reorder"
NODE_TIME_ENTRIES_PATH = "/nodes/{node_id}/time-entries"
NODE_TIMER_PATH = "/nodes/{node_id}/timer"
NODE_TIMER_START_PATH = "/nodes/{node_id}/timer/start"
NODE_TIMER_PAUSE_PATH = "/nodes/{node_id}/timer/pause"
NODE_TIMER_RESUME_PATH = "/nodes/{node_id}/timer/resume"
NODE_TIMER_END_PATH = "/nodes/{node_id}/timer/end"
TAG_LIST_PATH = "/tags"
TAG_BY_ID_PATH = "/tags/{tag_id}"
REFERENCE_TYPES_PATH = "/reference-types"
REFERENCE_SEARCH_PATH = "/references/search"
REFERENCE_DETAIL_PATH = "/references/detail"
REFERENCE_SETTINGS_PATH = "/reference-settings"
CONSTELLATION_STATE_PATH = "/constellation-state"
CONSTELLATION_SETTINGS_PATH = "/constellation-settings"

DEFAULT_TAG_COLOR_HEX = "#06B6D4"
DEFAULT_TITLE_FONT_KEY = "default"

ALLOWED_TITLE_FONT_KEYS: frozenset[str] = frozenset(
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

VALID_NODE_KINDS: frozenset[str] = frozenset({"item", "list", "record"})
VALID_CONTAINER_KINDS: frozenset[str] = frozenset({"list", "record"})
VALID_NODE_STATUSES: frozenset[str] = frozenset(
    {"active", "paused", "completed", "archived", "limbo"}
)
VALID_TIMER_STATUSES: frozenset[str] = frozenset({"running", "paused", "ended"})
MAX_PARENT_DEPTH = 64

PREFERENCES_FOCUS_KEY = "focus"
PREFERENCES_REFERENCE_ENABLED_TYPES_KEY = "reference_enabled_types"
PREFERENCES_CONSTELLATION_STATE_KEY = "constellation"
PREFERENCES_CONSTELLATION_SETTINGS_KEY = "constellation_settings"
CONSTELLATION_STATE_VERSION = 6

ALLOWED_CONSTELLATION_NODE_SHAPES: frozenset[str] = frozenset({"circle", "hexagon"})
ALLOWED_CONSTELLATION_CANVAS_TONES: frozenset[str] = frozenset({"slate", "black", "ocean"})
ALLOWED_CONSTELLATION_CONNECTION_COLORS: frozenset[str] = frozenset(
    {"silver", "cyan", "amber", "violet", "emerald", "rose"},
)
ALLOWED_CONSTELLATION_CONNECTION_STYLES: frozenset[str] = frozenset({"flexible", "straight"})
ALLOWED_CONSTELLATION_LIST_NODE_STYLES: frozenset[str] = frozenset(
    {"glass", "metallic", "matte", "prism", "ember", "classic"},
)

CONSTELLATION_NODE_SIZE_MULTIPLIER_MIN = 0.75
CONSTELLATION_NODE_SIZE_MULTIPLIER_MAX = 1.35
CONSTELLATION_NODE_SIZE_MULTIPLIER_DEFAULT = 1.0
CONSTELLATION_TITLE_SIZE_MIN = 11
CONSTELLATION_TITLE_SIZE_MAX = 44
CONSTELLATION_TITLE_SIZE_DEFAULT = 11
CONSTELLATION_UNLINK_DISTANCE_MIN = 0.8
CONSTELLATION_UNLINK_DISTANCE_MAX = 12.0
CONSTELLATION_UNLINK_DISTANCE_DEFAULT = 2.0
CONSTELLATION_CONFIG_POSITION_DEFAULT_X = 24.0
CONSTELLATION_CONFIG_POSITION_DEFAULT_Y = 32.0
CONSTELLATION_NOTES_PANEL_POSITION_DEFAULT_X = 20.0
CONSTELLATION_NOTES_PANEL_POSITION_DEFAULT_Y = 680.0

# Container kinds that share constellation/hub presentation fields.
CONTAINER_PRESENTATION_KINDS: frozenset[str] = frozenset({"list", "record"})
