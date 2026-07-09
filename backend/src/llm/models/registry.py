# stack_sandbox/backend/src/llm/models/registry.py
"""LLM model catalog from the DB-backed cache."""

from __future__ import annotations

from typing import TypedDict

from llm.catalog.cache import ModelEntry, get_catalog_cache


class ModelEntryDict(TypedDict):
    id: str
    provider: str
    display_name: str
    max_context_window: int | None
    input_price_per_1m: float | None
    output_price_per_1m: float | None


def _to_dict(entry: ModelEntry) -> ModelEntryDict:
    """Convert a catalog ModelEntry to a plain dict."""
    return {
        "id": entry.id,
        "provider": entry.provider,
        "display_name": entry.display_name,
        "max_context_window": entry.max_context_window,
        "input_price_per_1m": entry.input_price_per_1m,
        "output_price_per_1m": entry.output_price_per_1m,
    }


def get_model(model_id: str) -> ModelEntryDict | None:
    """Look up one enabled LLM model by id."""
    cache = get_catalog_cache()
    cache.require_loaded()
    entry = cache.models.get(model_id)
    if entry is None or not entry.is_enabled or entry.modality_key != "llm":
        return None
    return _to_dict(entry)


def get_models_for_provider(provider: str) -> list[ModelEntryDict]:
    """List enabled LLM models for a provider."""
    cache = get_catalog_cache()
    cache.require_loaded()
    normalized = provider.strip().lower()
    return [
        _to_dict(entry)
        for entry in cache.models.values()
        if entry.provider == normalized and entry.is_enabled and entry.modality_key == "llm"
    ]


def get_default_model_for_provider(provider: str) -> str:
    """Return the provider's default enabled LLM model id."""
    cache = get_catalog_cache()
    cache.require_loaded()
    normalized = provider.strip().lower()
    for entry in cache.models.values():
        if (
            entry.provider == normalized
            and entry.is_provider_default
            and entry.is_enabled
            and entry.modality_key == "llm"
        ):
            return entry.id
    raise ValueError(f"Unknown provider or no default model: {provider!r}")


def list_provider_ids() -> list[str]:
    """List enabled provider keys in catalog sort order."""
    cache = get_catalog_cache()
    cache.require_loaded()
    return [
        entry.key
        for entry in sorted(cache.providers.values(), key=lambda p: (p.sort_order, p.key))
        if entry.is_enabled
    ]


def is_known_provider(provider: str) -> bool:
    """Return whether the provider exists and is enabled."""
    cache = get_catalog_cache()
    cache.require_loaded()
    normalized = provider.strip().lower()
    provider_entry = cache.providers.get(normalized)
    return provider_entry is not None and provider_entry.is_enabled


def get_all_models() -> list[ModelEntryDict]:
    """List all enabled LLM models across providers."""
    cache = get_catalog_cache()
    cache.require_loaded()
    return [
        _to_dict(entry)
        for entry in cache.models.values()
        if entry.is_enabled and entry.modality_key == "llm"
    ]
