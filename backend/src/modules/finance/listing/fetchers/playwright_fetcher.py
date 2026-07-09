# stack_sandbox/backend/src/modules/shop/listing/fetchers/playwright_fetcher.py

"""Headless Chromium listing fetcher for JS-rendered pages."""

from __future__ import annotations

from core.errors import AppError
from modules.finance.listing import config as listing_config
from modules.finance.listing.detect import is_amazon_host
from modules.finance.listing.fetchers.base import FetchResult

AMAZON_PRODUCT_SELECTOR = "#productTitle, #landingImage, .a-price"


class PlaywrightListingFetcher:
    name = "playwright"

    async def fetch(self, url: str) -> FetchResult:
        """Fetch listing HTML via headless browser."""
        try:
            from playwright.async_api import async_playwright
        except ImportError as exc:
            raise AppError(
                "Playwright is not installed; enable httpx-only fetching.",
                status_code=503,
            ) from exc

        timeout_ms = int(listing_config.FETCH_TIMEOUT_SECONDS * 1000)
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=True)
            try:
                context_kwargs: dict[str, str] = {
                    "user_agent": listing_config.USER_AGENT,
                }
                if is_amazon_host(url):
                    context_kwargs["locale"] = "en-US"
                context = await browser.new_context(**context_kwargs)
                page = await context.new_page()
                response = await page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=timeout_ms,
                )
                status = response.status if response is not None else 200
                if status >= 400:
                    raise AppError(
                        f"Failed to render listing (HTTP {status}).",
                        status_code=502,
                    )

                if is_amazon_host(url):
                    try:
                        await page.wait_for_selector(
                            AMAZON_PRODUCT_SELECTOR,
                            timeout=min(timeout_ms, 15_000),
                        )
                    except Exception:
                        pass

                html = await page.content()
                final_url = page.url
            finally:
                await browser.close()

        if len(html.encode("utf-8")) > listing_config.MAX_LISTING_BYTES:
            raise AppError("Rendered listing page is too large.", status_code=400)

        return FetchResult(
            html=html,
            final_url=final_url,
            status_code=status,
            rendered=True,
        )
