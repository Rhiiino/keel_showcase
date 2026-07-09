# keel_api/src/modules/deleted/config.py
"""Route constants and entity-type validation for the deleted module."""

from __future__ import annotations

FEATURE_KEY = "deleted"
OPENAPI_TAG = "deleted"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

ROOT_PATH = ""
CONFIG_PATH = "/config"
RECORD_BY_ID_PATH = "/{record_id}"
RESTORE_PATH = "/{record_id}/restore"

PURGE_SCHEDULE_HINT = "Daily at 3:30 AM (America/New_York)"
