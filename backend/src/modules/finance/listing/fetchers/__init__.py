# stack_sandbox/backend/src/modules/shop/listing/fetchers/__init__.py

"""Ordered listing fetchers (httpx first, optional Playwright; Amazon prefers Playwright)."""

from __future__ import annotations

from modules.finance.listing.detect import is_amazon_host
from modules.finance.listing.fetchers.base import FetchResult, ListingFetcher
from modules.finance.listing.fetchers.httpx_fetcher import HttpxListingFetcher


def get_fetcher_chain(url: str | None = None) -> list[ListingFetcher]:
    """Return fetchers in escalation order."""
    httpx_fetcher = HttpxListingFetcher()
    playwright_fetcher = _playwright_fetcher()

    if url and is_amazon_host(url) and playwright_fetcher is not None:
        return [playwright_fetcher, httpx_fetcher]

    chain: list[ListingFetcher] = [httpx_fetcher]
    if playwright_fetcher is not None:
        chain.append(playwright_fetcher)
    return chain


def _playwright_fetcher() -> ListingFetcher | None:
    """Return a Playwright fetcher when available."""
    if not _playwright_available():
        return None
    from modules.finance.listing.fetchers.playwright_fetcher import (
        PlaywrightListingFetcher,
    )

    return PlaywrightListingFetcher()


def _playwright_available() -> bool:
    """Return True when Playwright is enabled and importable."""
    from modules.finance.listing import config as listing_config

    if not listing_config.playwright_enabled():
        return False
    try:
        import playwright  # noqa: F401

        return True
    except ImportError:
        return False
