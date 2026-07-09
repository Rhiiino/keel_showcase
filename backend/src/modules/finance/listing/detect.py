# stack_sandbox/backend/src/modules/shop/listing/detect.py

"""Detect bot/captcha pages and Amazon hosts for listing fetch."""

from __future__ import annotations

from urllib.parse import urlparse

CAPTCHA_MARKERS = (
    "validatecaptcha",
    "opfcaptcha.amazon.com",
    "click the button below to continue shopping",
)

SMALL_PAGE_BYTE_THRESHOLD = 20_000


def is_amazon_host(url: str) -> bool:
    """True when the URL hostname is an Amazon retail domain."""
    host = (urlparse(url).hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    return ".amazon." in f".{host}." or host.endswith(".amazon") or host == "amazon.com"


def is_blocked_page(html: str) -> bool:
    """True when HTML looks like a bot/captcha interstitial rather than a product page."""
    if not html:
        return True

    lower = html.lower()
    if any(marker in lower for marker in CAPTCHA_MARKERS):
        return True

    if len(html.encode("utf-8", errors="replace")) < SMALL_PAGE_BYTE_THRESHOLD:
        if "amazon.com" in lower and "producttitle" not in lower:
            return True

    return False
