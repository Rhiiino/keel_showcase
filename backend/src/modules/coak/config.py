# keel_api/src/modules/coak/config.py

"""Coak module constants — routes, kinds, and colors."""

from __future__ import annotations

FEATURE_KEY = "coak"
OPENAPI_TAG = "coak"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

RECORDS_PATH = "/records"
RECORD_BY_ID_PATH = "/records/{record_id}"
RECORD_ITEMS_PATH = "/records/{record_id}/items"
RECORD_ITEM_BY_ID_PATH = "/records/{record_id}/items/{item_id}"
RECORD_WORKSPACE_STATE_PATH = "/records/{record_id}/workspace-state"
RECORD_WORKSPACE_SETTINGS_PATH = "/records/{record_id}/workspace-settings"
RECORD_CONFIGURATION_SETTINGS_PATH = "/records/{record_id}/configuration-settings"
RECORD_TAGS_PATH = "/records/{record_id}/tags"
RECORD_TAG_BY_ID_PATH = "/records/{record_id}/tags/{tag_id}"

COAK_ITEM_KINDS: frozenset[str] = frozenset({"folder", "note", "flash"})

DEFAULT_RECORD_COLOR_HEX = "#FBBF24"
DEFAULT_ITEM_COLOR_HEX = "#06B6D4"

WORKSPACE_STATE_VERSION = 2
