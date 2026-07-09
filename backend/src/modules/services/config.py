# keel_api/src/modules/services/config.py

"""Services module constants — routes and health status values."""

from __future__ import annotations

FEATURE_KEY = "services"
OPENAPI_TAG = "services"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

LIST_PATH = ""
SERVICE_BY_ID_PATH = "/{service_id}"
SERVICE_CHECK_PATH = "/{service_id}/check"

VALID_STATUSES: frozenset[str] = frozenset({"up", "down", "caution"})

DEFAULT_EXPECTED_STATUS_CODE = 200
DEFAULT_FAILURE_THRESHOLD = 3

PROBE_TIMEOUT_SECONDS = 15
MAX_ERROR_MESSAGE_LENGTH = 500
