# keel_api/src/modules/shop/listing/config.py

"""Settings for listing fetch and parse."""

from __future__ import annotations

from core.config import get_settings
from modules.media import config as media_config

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36"
)

FETCH_TIMEOUT_SECONDS = 25.0
MAX_LISTING_BYTES = 5 * 1024 * 1024
# Max is len(TRACKED_FIELDS) in extract.py (title, price_amount, image_url, merchant_name).
MIN_FIELDS_FOR_SUCCESS = 4

BROWSER_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,"
        "image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Upgrade-Insecure-Requests": "1",
}

ALLOWED_COVER_MIME_TYPES = media_config.ALLOWED_IMAGE_MIME_TYPES
MAX_COVER_BYTES = media_config.MAX_IMAGE_BYTES
MIME_TO_EXTENSION = media_config.MIME_TO_EXTENSION


def playwright_enabled() -> bool:
    """Whether to include Playwright in the fetcher chain."""
    return get_settings().haul_playwright_enabled
