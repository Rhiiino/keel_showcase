# stack_sandbox/backend/src/modules/projects/config.py

"""Projects module settings — route paths and upload limits."""

FEATURE_KEY = "projects"
OPENAPI_TAG = "projects"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

LIST_PATH = ""
PROJECT_BY_ID_PATH = "/{project_id}"
PROJECT_CANVASES_PATH = "/{project_id}/canvases"
PROJECT_CANVAS_BY_ID_PATH = "/{project_id}/canvases/{canvas_id}"
PROJECT_CANVAS_WORKSPACE_PATH = "/{project_id}/canvases/{canvas_id}/workspace"
PROJECT_CANVAS_WORKSPACE_SETTINGS_PATH = (
    "/{project_id}/canvases/{canvas_id}/workspace/settings"
)
PROJECT_WORKSPACE_PATH = "/{project_id}/workspace"
PROJECT_WORKSPACE_SETTINGS_PATH = "/{project_id}/workspace/settings"
PROJECT_FOLDERS_PATH = "/{project_id}/folders"
PROJECT_FOLDER_BY_ID_PATH = "/{project_id}/folders/{folder_id}"
TAG_LIST_PATH = "/tags"
TAG_BY_ID_PATH = "/tags/{tag_id}"

DEFAULT_TAG_COLOR_HEX = "#06B6D4"
DEFAULT_COVER_GLOW_COLOR_HEX = "#84CC16"
DEFAULT_COVER_MODEL_COLOR_HEX = "#A8B5A0"
DEFAULT_KANBAN_CARD_COLOR_HEX = "#1C1917"
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

ALLOWED_WORKSPACE_CANVAS_COLORS: frozenset[str] = frozenset({"default", "slate", "midnight"})
WORKSPACE_CANVAS_COLOR_DEFAULT = "default"
WORKSPACE_SNAP_ENABLED_DEFAULT = False
WORKSPACE_MINIMAP_OPEN_DEFAULT = True
WORKSPACE_GRID_DOT_STRENGTH_MIN = 0.35
WORKSPACE_GRID_DOT_STRENGTH_MAX = 1.4
WORKSPACE_GRID_DOT_STRENGTH_DEFAULT = 1.0
WORKSPACE_CONFIG_POSITION_DEFAULT_X = 24.0
WORKSPACE_CONFIG_POSITION_DEFAULT_Y = 32.0

ALLOWED_WORKSPACE_CONNECTION_STYLES: frozenset[str] = frozenset({"smooth", "straight"})
WORKSPACE_CONNECTION_STYLE_DEFAULT = "smooth"

ALLOWED_WORKSPACE_NOTE_COLOR_STYLES: frozenset[str] = frozenset(
    {"filled", "soft", "outline", "bold"},
)
WORKSPACE_NOTE_COLOR_STYLE_DEFAULT = "filled"

ALLOWED_WORKSPACE_NOTE_ITALIC_COLORS: frozenset[str] = frozenset(
    {"slate", "rose", "amber", "sky", "emerald", "violet", "coral"},
)
WORKSPACE_NOTE_ITALIC_COLOR_DEFAULT = "slate"

WORKSPACE_TEXT_FONT_SCALE_MIN = 0.75
WORKSPACE_TEXT_FONT_SCALE_MAX = 50 / 14
WORKSPACE_TEXT_FONT_SCALE_DEFAULT = 1.0
