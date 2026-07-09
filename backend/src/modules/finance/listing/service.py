# stack_sandbox/backend/src/modules/shop/listing/service.py

"""Fetch and parse product listings; download cover images by URL."""

from __future__ import annotations

from dataclasses import asdict
from urllib.parse import urlparse

import httpx

from core.errors import AppError
from modules.finance.listing import config as listing_config
from modules.finance.listing.detect import is_blocked_page
from modules.finance.listing.extract import ParsedListing, extract, is_sparse
from modules.finance.listing.fetchers import get_fetcher_chain


def _validate_http_url(url: str) -> str:
    """Validate and normalize an http(s) URL."""
    parsed = urlparse(url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise AppError("URL must be a valid http or https link.", status_code=400)
    return url.strip()


def url_to_origin(url: str | None) -> str | None:
    """Reduce a URL to scheme + netloc (root domain), or None if invalid."""
    if not url or not str(url).strip():
        return None
    try:
        normalized = _validate_http_url(str(url).strip())
    except AppError:
        return None
    parsed = urlparse(normalized)
    return f"{parsed.scheme}://{parsed.netloc}"


def _result_score(found: set[str], blocked: bool) -> tuple[int, int]:
    """Higher is better: prefer non-blocked pages with more tracked fields."""
    return (0 if blocked else 1, len(found))


async def fetch_listing(url: str) -> dict[str, object]:
    """Fetch a listing page and extract product fields.

    Returns a JSON-serializable dict with parsed fields, found_fields, blocked, and partial.
    """
    normalized = _validate_http_url(url)
    chain = get_fetcher_chain(normalized)
    if not chain:
        raise AppError("No listing fetchers are configured.", status_code=503)

    last_error: AppError | None = None
    best_parsed: ParsedListing | None = None
    best_found: set[str] = set()
    best_url = normalized
    best_blocked = True
    best_score = (-1, -1)

    for fetcher in chain:
        try:
            result = await fetcher.fetch(normalized)
        except AppError as exc:
            last_error = exc
            continue

        blocked = is_blocked_page(result.html)
        parsed, found = extract(result.html, result.final_url)
        score = _result_score(found, blocked)

        if score > best_score:
            best_parsed = parsed
            best_found = found
            best_url = result.final_url
            best_blocked = blocked
            best_score = score

        if not blocked and not is_sparse(found):
            return _listing_response(parsed, found, blocked=False, partial=False)

    if best_parsed is None:
        if last_error is not None:
            raise last_error
        raise AppError("Could not fetch listing page.", status_code=502)

    partial = is_sparse(best_found) or best_blocked
    return _listing_response(
        best_parsed,
        best_found,
        blocked=best_blocked,
        partial=partial,
        final_url=best_url,
    )


def _listing_response(
    parsed: ParsedListing,
    found: set[str],
    *,
    blocked: bool,
    partial: bool,
    final_url: str | None = None,
) -> dict[str, object]:
    """Build the listing fetch API response envelope."""
    data = asdict(parsed)
    if final_url:
        data["final_url"] = final_url
    return {
        **data,
        "found_fields": sorted(found),
        "blocked": blocked,
        "partial": partial,
    }


async def download_image(url: str) -> tuple[bytes, str]:
    """Download an image from a URL for use as a purchase cover."""
    normalized = _validate_http_url(url)
    headers = {"User-Agent": listing_config.USER_AGENT, "Accept": "image/*,*/*"}
    async with httpx.AsyncClient(
        timeout=listing_config.FETCH_TIMEOUT_SECONDS,
        follow_redirects=True,
    ) as client:
        response = await client.get(normalized, headers=headers)

    if response.status_code >= 400:
        raise AppError(
            f"Failed to download image (HTTP {response.status_code}).",
            status_code=502,
        )

    data = response.content
    if len(data) > listing_config.MAX_COVER_BYTES:
        raise AppError("Image is too large.", status_code=400)
    if not data:
        raise AppError("Image is empty.", status_code=400)

    mime = (response.headers.get("content-type") or "application/octet-stream").split(
        ";",
        maxsplit=1,
    )[0].strip().lower()
    if mime not in listing_config.ALLOWED_COVER_MIME_TYPES:
        raise AppError("Unsupported image type for cover.", status_code=400)

    return data, mime



# ----- Vendor logo heuristics
def vendor_logo_url_candidates(page_url: str | None) -> list[str]:
    """Best-effort favicon / touch-icon URLs for a vendor site."""
    if not page_url:
        return []
    try:
        normalized = _validate_http_url(page_url)
    except AppError:
        return []
    parsed = urlparse(normalized)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    host = parsed.netloc
    domain = host[4:] if host.startswith("www.") else host
    google_favicon = f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
    return [
        google_favicon,
        f"{origin}/apple-touch-icon.png",
        f"{origin}/apple-touch-icon-precomposed.png",
        f"{origin}/favicon.ico",
    ]
