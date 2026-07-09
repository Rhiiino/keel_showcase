# stack_sandbox/backend/src/modules/shop/listing/fetchers/base.py

"""Fetcher protocol and result type."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class FetchResult:
    html: str
    final_url: str
    status_code: int
    rendered: bool


class ListingFetcher(Protocol):
    """Fetch a product listing page and return HTML."""

    name: str

    async def fetch(self, url: str) -> FetchResult:
        """Retrieve page HTML for the given URL."""
