# stack_sandbox/backend/src/modules/shop/listing/extractors/amazon.py

"""Amazon product page field extraction (DOM + inline JSON)."""

from __future__ import annotations

import json
import re
from urllib.parse import urlparse

from bs4 import BeautifulSoup

from modules.finance.listing.extract import (
    ParsedListing,
    _normalize_price,
    _set_if_missing,
)

_PRICE_JSON_PATTERNS = (
    re.compile(r'"priceAmount"\s*:\s*([\d.]+)'),
    re.compile(r'"priceToPay"\s*:\s*\{[^}]*"amount"\s*:\s*([\d.]+)'),
    re.compile(r'"displayPrice"\s*:\s*"([^"]+)"'),
)

_CURRENCY_JSON_PATTERN = re.compile(r'"priceCurrency"\s*:\s*"([A-Z]{3})"')

_CAPTCHA_TITLE = "amazon.com"


def apply_amazon(
    html: str,
    soup: BeautifulSoup,
    page_url: str,
    parsed: ParsedListing,
    found: set[str],
) -> None:
    """Fill product fields from Amazon-specific markup when generic extractors miss them."""
    _apply_amazon_title(soup, parsed, found)
    _apply_amazon_description(soup, parsed)
    _apply_amazon_price(html, soup, page_url, parsed, found)
    _apply_amazon_image(soup, page_url, parsed, found)


def _apply_amazon_title(
    soup: BeautifulSoup,
    parsed: ParsedListing,
    found: set[str],
) -> None:
    """Extract product title from Amazon DOM selectors."""
    if parsed.title and parsed.title.lower() != _CAPTCHA_TITLE:
        return

    for selector in ("#productTitle", "span#title"):
        element = soup.select_one(selector)
        if element is None:
            continue
        title = element.get_text(strip=True)
        if title and title.lower() != _CAPTCHA_TITLE:
            parsed.title = title
            found.add("title")
            return


def _apply_amazon_description(soup: BeautifulSoup, parsed: ParsedListing) -> None:
    """Extract product description from Amazon DOM."""
    if parsed.description:
        return
    tag = soup.find("meta", attrs={"name": "description"})
    if tag and tag.get("content"):
        content = str(tag["content"]).strip()
        if content:
            parsed.description = content


def _apply_amazon_price(
    html: str,
    soup: BeautifulSoup,
    page_url: str,
    parsed: ParsedListing,
    found: set[str],
) -> None:
    """Extract price and currency from Amazon page data."""
    if parsed.price_amount:
        return

    price_amount: str | None = None
    currency: str | None = None

    for pattern in _PRICE_JSON_PATTERNS:
        match = pattern.search(html)
        if not match:
            continue
        raw = match.group(1)
        price_amount = _normalize_price(raw) if raw else None
        if price_amount:
            break

    if not price_amount:
        price_amount = _price_from_dom(soup)

    if price_amount:
        currency_match = _CURRENCY_JSON_PATTERN.search(html)
        if currency_match:
            currency = currency_match.group(1)
        elif _default_currency_for_host(page_url):
            currency = _default_currency_for_host(page_url)

        _set_if_missing(
            parsed,
            found,
            "price_amount",
            price_amount=price_amount,
            currency=currency or _default_currency_for_host(page_url),
        )


def _price_from_dom(soup: BeautifulSoup) -> str | None:
    """Read displayed price text from Amazon DOM nodes."""
    whole = soup.select_one(".a-price .a-price-whole")
    if whole is None:
        return None
    whole_text = whole.get_text(strip=True).replace(",", "")
    fraction = soup.select_one(".a-price .a-price-fraction")
    fraction_text = fraction.get_text(strip=True) if fraction else "00"
    return _normalize_price(f"{whole_text}.{fraction_text}")


def _apply_amazon_image(
    soup: BeautifulSoup,
    page_url: str,
    parsed: ParsedListing,
    found: set[str],
) -> None:
    """Extract the primary product image from Amazon DOM."""
    if parsed.image_url:
        return

    image = soup.select_one("#landingImage")
    if image is None:
        return

    for attr in ("data-old-hires", "src"):
        value = image.get(attr)
        if isinstance(value, str) and value.strip().startswith("http"):
            _set_if_missing(parsed, found, "image_url", image_url=value.strip())
            return

    dynamic = image.get("data-a-dynamic-image")
    if isinstance(dynamic, str) and dynamic.strip():
        try:
            urls = json.loads(dynamic)
            if isinstance(urls, dict) and urls:
                first_url = next(iter(urls.keys()))
                if first_url.startswith("http"):
                    _set_if_missing(parsed, found, "image_url", image_url=first_url)
        except json.JSONDecodeError:
            pass


def _default_currency_for_host(page_url: str) -> str | None:
    """Infer default currency from an Amazon hostname."""
    host = (urlparse(page_url).hostname or "").lower()
    if host.endswith(".com") and (host == "amazon.com" or host.endswith(".amazon.com")):
        return "USD"
    if host.endswith(".co.uk"):
        return "GBP"
    if host.endswith(".ca"):
        return "CAD"
    if host.endswith(".de"):
        return "EUR"
    return None
