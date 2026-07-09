# keel_api/src/modules/media/config.py

"""Media module settings — route paths and upload limits."""

FEATURE_KEY = "media"
OPENAPI_TAG = "media"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

LIST_PATH = ""
ALL_MEDIA_PATH = "/all"
FOLDERS_PATH = "/folders"
FOLDER_BY_ID_PATH = "/folders/{folder_id}"
MEDIA_BY_ID_PATH = "/{media_id}"
MEDIA_CONTENT_PATH = "/{media_id}/content"
MEDIA_METADATA_PATH = "/{media_id}/metadata"
MEDIA_ATTACHMENTS_PATH = "/{media_id}/attachments"
ATTACHMENT_BY_ID_PATH = "/attachments/{attachment_id}"
BY_ENTITY_PATH = "/by-entity/{entity_type}/{entity_id}"

PANELS_PATH = "/panels"
PANEL_BY_ID_PATH = "/panels/{panel_id}"
PANEL_ITEMS_PATH = "/panels/{panel_id}/items"
PANEL_ITEM_BY_ID_PATH = "/panels/{panel_id}/items/{item_id}"
PANEL_LAYOUT_PATH = "/panels/{panel_id}/layout"
PANEL_ITEMS_SWAP_PATH = "/panels/{panel_id}/items/swap"

DEFAULT_PANEL_COLUMN_COUNT = 12
DEFAULT_PANEL_ROW_UNIT_PX = 64
MAX_PANEL_NAME_LENGTH = 200

VALID_ENTITY_TYPES: frozenset[str] = frozenset(
    {
        "project",
        "finance_transaction",
        "finance_obligation",
        "contact",
        "figure",
        "finance_vendor",
        "timeline_event",
        "journal_entry",
    }
)
VALID_ROLES: frozenset[str] = frozenset({"gallery", "cover", "photo", "logo"})
VALID_MEDIA_KINDS: frozenset[str] = frozenset(
    {"image", "video", "audio", "document", "model_3d", "other"}
)
VALID_STATUSES: frozenset[str] = frozenset({"pending", "ready", "deleted"})

MAX_MEDIA_BYTES = 100 * 1024 * 1024
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_FOLDER_DEPTH = 20
MAX_FOLDER_NAME_LENGTH = 200

ALLOWED_IMAGE_MIME_TYPES: frozenset[str] = frozenset(
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    }
)

MIME_TO_EXTENSION: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
}

MODEL_3D_EXTENSIONS: frozenset[str] = frozenset(
    {
        ".stl",
        ".obj",
        ".gltf",
        ".glb",
        ".fbx",
        ".3mf",
        ".step",
        ".stp",
        ".iges",
        ".igs",
        ".dae",
        ".ply",
        ".wrl",
        ".x3d",
        ".usdz",
        ".usd",
        ".3ds",
        ".blend",
        ".ma",
        ".mb",
        ".c4d",
        ".amf",
        ".off",
        ".ac",
        ".ac3d",
    }
)

MODEL_3D_MIME_TYPES: frozenset[str] = frozenset(
    {
        "model/stl",
        "application/sla",
        "application/vnd.ms-pki.stl",
        "application/octet-stream",
        "model/obj",
        "model/gltf+json",
        "model/gltf-binary",
    }
)

TEXT_FILE_EXTENSIONS: frozenset[str] = frozenset(
    {
        ".txt",
        ".md",
        ".markdown",
        ".json",
        ".csv",
        ".tsv",
        ".xml",
        ".yaml",
        ".yml",
        ".log",
        ".html",
        ".htm",
        ".css",
        ".js",
        ".mjs",
        ".cjs",
        ".ts",
        ".tsx",
        ".jsx",
        ".py",
        ".rb",
        ".go",
        ".rs",
        ".java",
        ".kt",
        ".swift",
        ".c",
        ".cc",
        ".cpp",
        ".h",
        ".hpp",
        ".cs",
        ".php",
        ".sh",
        ".bash",
        ".zsh",
        ".toml",
        ".ini",
        ".cfg",
        ".conf",
        ".env",
        ".rtf",
        ".tex",
        ".rst",
        ".adoc",
        ".asciidoc",
    }
)

DOCUMENT_FILE_EXTENSIONS: frozenset[str] = frozenset({".pdf"})

ALLOWED_MEDIA_EXTENSIONS: frozenset[str] = (
    MODEL_3D_EXTENSIONS | TEXT_FILE_EXTENSIONS | DOCUMENT_FILE_EXTENSIONS
)

EXTRA_TEXT_MIME_TYPES: frozenset[str] = frozenset(
    {
        "application/pdf",
        "application/json",
        "application/xml",
        "text/markdown",
        "application/javascript",
        "application/typescript",
    }
)

IMAGE_MIME_PREFIX = "image/"
VIDEO_MIME_PREFIX = "video/"
AUDIO_MIME_PREFIX = "audio/"
TEXT_MIME_PREFIX = "text/"
