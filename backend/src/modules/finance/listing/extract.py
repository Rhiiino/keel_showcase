# stack_sandbox/backend/src/modules/shop/listing/extract.py

"""Parse product fields from listing HTML."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Any
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from modules.finance.listing.detect import is_amazon_host

TRACKED_FIELDS = frozenset({"title", "price_amount", "image_url", "vendor_name"})


@dataclass
class ParsedListing:
    title: str | None = None
    price_amount: str | None = None
    currency: str | None = None
    image_url: str | None = None
    vendor_name: str | None = None
    description: str | None = None


def extract(html: str, page_url: str) -> tuple[ParsedListing, set[str]]:
    """Extract product fields; return parsed data and which tracked fields were found."""
    soup = BeautifulSoup(html, "lxml")
    parsed = ParsedListing()
    found: set[str] = set()

    _apply_json_ld(soup, page_url, parsed, found)
    _apply_open_graph(soup, page_url, parsed, found)
    _apply_twitter(soup, page_url, parsed, found)
    _apply_title_fallback(soup, parsed, found)
    _apply_merchant_domain(page_url, parsed, found)

    if is_amazon_host(page_url):
        from modules.finance.listing.extractors.amazon import apply_amazon

        apply_amazon(html, soup, page_url, parsed, found)

    return parsed, found


def is_sparse(found_fields: set[str]) -> bool:
    """True when extraction did not find enough fields to trust the page."""
    from modules.finance.listing import config as listing_config

    core = found_fields & TRACKED_FIELDS
    return len(core) < listing_config.MIN_FIELDS_FOR_SUCCESS


def _set_if_missing(
    parsed: ParsedListing,
    found: set[str],
    field: str,
    *,
    title: str | None = None,
    price_amount: str | None = None,
    currency: str | None = None,
    image_url: str | None = None,
    vendor_name: str | None = None,
    description: str | None = None,
) -> None:
    """Set a parsed field when not already present."""
    if field == "title" and title and not parsed.title:
        parsed.title = title
        found.add("title")
    if field == "price_amount" and price_amount and not parsed.price_amount:
        parsed.price_amount = price_amount
        found.add("price_amount")
    if currency and not parsed.currency:
        parsed.currency = currency
    if field == "image_url" and image_url and not parsed.image_url:
        parsed.image_url = image_url
        found.add("image_url")
    if field == "vendor_name" and vendor_name and not parsed.vendor_name:
        parsed.vendor_name = vendor_name
        found.add("vendor_name")
    if description and not parsed.description:
        parsed.description = description


def _apply_json_ld(
    soup: BeautifulSoup,
    page_url: str,
    parsed: ParsedListing,
    found: set[str],
) -> None:
    """Extract product fields from JSON-LD script tags."""
    for script in soup.find_all("script", type="application/ld+json"):
        raw = script.string or script.get_text()
        if not raw or not raw.strip():
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        for node in _iter_json_ld_nodes(data):
            if not _is_product_type(node):
                continue
            title = _as_str(node.get("name"))
            description = _as_str(node.get("description"))
            image_url = _resolve_image(node.get("image"), page_url)
            vendor_name = _brand_from_product(node)
            price_amount, currency = _price_from_offers(node.get("offers"))
            _set_if_missing(
                parsed,
                found,
                "title",
                title=title,
                description=description,
                image_url=image_url,
                vendor_name=vendor_name,
                price_amount=price_amount,
                currency=currency,
            )
            if price_amount:
                _set_if_missing(
                    parsed,
                    found,
                    "price_amount",
                    price_amount=price_amount,
                    currency=currency,
                )
            if image_url:
                _set_if_missing(parsed, found, "image_url", image_url=image_url)
            if vendor_name:
                _set_if_missing(
                    parsed,
                    found,
                    "vendor_name",
                    vendor_name=vendor_name,
                )


def _apply_open_graph(
    soup: BeautifulSoup,
    page_url: str,
    parsed: ParsedListing,
    found: set[str],
) -> None:
    """Extract product fields from Open Graph meta tags."""
    meta = _meta_map(soup)
    title = meta.get("og:title") or meta.get("title")
    description = meta.get("og:description") or meta.get("description")
    image_url = _abs_url(meta.get("og:image"), page_url)
    site_name = meta.get("og:site_name")
    price_amount = meta.get("product:price:amount") or meta.get("og:price:amount")
    currency = meta.get("product:price:currency") or meta.get("og:price:currency")
    if price_amount:
        price_amount = _normalize_price(price_amount)
    _set_if_missing(
        parsed,
        found,
        "title",
        title=title,
        description=description,
        image_url=image_url,
        vendor_name=site_name,
        price_amount=price_amount,
        currency=currency,
    )
    if price_amount:
        _set_if_missing(
            parsed,
            found,
            "price_amount",
            price_amount=price_amount,
            currency=currency,
        )
    if image_url:
        _set_if_missing(parsed, found, "image_url", image_url=image_url)
    if site_name:
        _set_if_missing(parsed, found, "vendor_name", vendor_name=site_name)


def _apply_twitter(
    soup: BeautifulSoup,
    page_url: str,
    parsed: ParsedListing,
    found: set[str],
) -> None:
    """Extract product fields from Twitter card meta tags."""
    meta = _meta_map(soup, prefix="twitter:")
    title = meta.get("twitter:title")
    description = meta.get("twitter:description")
    image_url = _abs_url(meta.get("twitter:image"), page_url)
    _set_if_missing(
        parsed,
        found,
        "title",
        title=title,
        description=description,
        image_url=image_url,
    )
    if image_url:
        _set_if_missing(parsed, found, "image_url", image_url=image_url)


def _apply_title_fallback(
    soup: BeautifulSoup,
    parsed: ParsedListing,
    found: set[str],
) -> None:
    """Use the HTML title when no product title was found."""
    if parsed.title:
        return
    if soup.title and soup.title.string:
        title = soup.title.string.strip()
        if title:
            _set_if_missing(parsed, found, "title", title=title)


def _apply_merchant_domain(
    page_url: str,
    parsed: ParsedListing,
    found: set[str],
) -> None:
    """Set merchant name from the page hostname."""
    if parsed.vendor_name:
        return
    host = urlparse(page_url).hostname or ""
    if host.startswith("www."):
        host = host[4:]
    if host:
        label = host.split(".")[0]
        if label:
            _set_if_missing(
                parsed,
                found,
                "vendor_name",
                vendor_name=label.replace("-", " ").title(),
            )


def _meta_map(soup: BeautifulSoup, prefix: str = "og:") -> dict[str, str]:
    """Build a map of meta tag property/content pairs."""
    result: dict[str, str] = {}
    for tag in soup.find_all("meta"):
        prop = tag.get("property") or tag.get("name") or ""
        content = tag.get("content")
        if not prop or not content:
            continue
        key = prop.lower()
        if prefix and not key.startswith(prefix) and prefix != "og:":
            continue
        if prefix == "og:" and not (
            key.startswith("og:")
            or key.startswith("product:")
            or key in {"title", "description"}
        ):
            if not key.startswith("twitter:"):
                continue
        result[key] = content.strip()
    return result


def _iter_json_ld_nodes(data: Any) -> list[dict[str, Any]]:
    """Flatten JSON-LD graph nodes into a list of dicts."""
    if isinstance(data, dict):
        graph = data.get("@graph")
        if isinstance(graph, list):
            nodes: list[dict[str, Any]] = []
            for item in graph:
                nodes.extend(_iter_json_ld_nodes(item))
            return nodes
        return [data]
    if isinstance(data, list):
        nodes: list[dict[str, Any]] = []
        for item in data:
            nodes.extend(_iter_json_ld_nodes(item))
        return nodes
    return []


def _is_product_type(node: dict[str, Any]) -> bool:
    """Return True when a JSON-LD node is a Product type."""
    raw_type = node.get("@type")
    if isinstance(raw_type, str):
        types = [raw_type]
    elif isinstance(raw_type, list):
        types = [str(t) for t in raw_type]
    else:
        return False
    return any("product" in t.lower() for t in types)


def _brand_from_product(node: dict[str, Any]) -> str | None:
    """Extract brand name from a JSON-LD product node."""
    brand = node.get("brand")
    if isinstance(brand, str):
        return brand.strip() or None
    if isinstance(brand, dict):
        return _as_str(brand.get("name"))
    return None


def _price_from_offers(offers: Any) -> tuple[str | None, str | None]:
    """Extract price amount and currency from offers data."""
    if offers is None:
        return None, None
    if isinstance(offers, list):
        offers = offers[0] if offers else None
    if not isinstance(offers, dict):
        return None, None
    price = offers.get("price") or offers.get("lowPrice") or offers.get("highPrice")
    currency = offers.get("priceCurrency")
    amount = _normalize_price(str(price)) if price is not None else None
    currency_str = _as_str(currency)
    return amount, currency_str


def _resolve_image(image: Any, page_url: str) -> str | None:
    """Resolve a product image URL against the page URL."""
    if isinstance(image, str):
        return _abs_url(image, page_url)
    if isinstance(image, list) and image:
        return _resolve_image(image[0], page_url)
    if isinstance(image, dict):
        return _abs_url(image.get("url") or image.get("@id"), page_url)
    return None


def _abs_url(value: str | None, base: str) -> str | None:
    """Resolve a relative URL against a base URL."""
    if not value or not str(value).strip():
        return None
    return urljoin(base, str(value).strip())


def _as_str(value: Any) -> str | None:
    """Coerce a value to a stripped string or None."""
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _normalize_price(raw: str) -> str | None:
    """Normalize a raw price string to a decimal form."""
    cleaned = re.sub(r"[^\d.,]", "", raw.strip())
    if not cleaned:
        return None
    if "," in cleaned and "." in cleaned:
        if cleaned.rfind(",") > cleaned.rfind("."):
            cleaned = cleaned.replace(".", "").replace(",", ".")
        else:
            cleaned = cleaned.replace(",", "")
    elif "," in cleaned:
        cleaned = cleaned.replace(",", ".")
    try:
        value = Decimal(cleaned)
    except InvalidOperation:
        return None
    return format(value, "f")
