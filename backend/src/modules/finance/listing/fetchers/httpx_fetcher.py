# stack_sandbox/backend/src/modules/shop/listing/fetchers/httpx_fetcher.py

"""Fast HTTP GET listing fetcher."""

from __future__ import annotations

import httpx

from core.errors import AppError
from modules.finance.listing import config as listing_config
from modules.finance.listing.fetchers.base import FetchResult


class HttpxListingFetcher:
    name = "httpx"

    async def fetch(self, url: str) -> FetchResult:
        """Fetch listing HTML via HTTP GET."""
        async with httpx.AsyncClient(
            timeout=listing_config.FETCH_TIMEOUT_SECONDS,
            follow_redirects=True,
        ) as client:
            response = await client.get(url, headers=listing_config.BROWSER_HEADERS)

        if response.status_code >= 400:
            raise AppError(
                f"Failed to fetch listing (HTTP {response.status_code}).",
                status_code=502,
            )

        content = response.content
        if len(content) > listing_config.MAX_LISTING_BYTES:
            raise AppError("Listing page is too large.", status_code=400)

        encoding = response.encoding or "utf-8"
        html = content.decode(encoding, errors="replace")
        return FetchResult(
            html=html,
            final_url=str(response.url),
            status_code=response.status_code,
            rendered=False,
        )
