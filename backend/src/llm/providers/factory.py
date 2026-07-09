# stack_sandbox/backend/src/llm/providers/factory.py
"""Select the active LLM provider and model from settings and the catalog cache."""

from __future__ import annotations

from core.config import get_settings
from core.errors import AppError
from llm.catalog.cache import get_catalog_cache
from llm.models.registry import (
    get_default_model_for_provider,
    get_model,
    is_known_provider,
)
from llm.providers.anthropic_provider import AnthropicProvider
from llm.providers.base import LLMStreamProvider
from llm.providers.moonshot_provider import DEFAULT_MOONSHOT_BASE_URL, MoonshotProvider
from llm.providers.openai_provider import OpenAIProvider


def env_fallback_provider_name() -> str:
    """Provider from `CHAT_LLM_PROVIDER` when the user has no saved preference."""
    return (get_settings().chat_llm_provider or "openai").strip().lower()


def resolve_model_id(*, provider_name: str, model: str | None) -> str:
    """Validate model for provider or return the provider default."""
    provider = provider_name.strip().lower()
    if not is_known_provider(provider):
        raise AppError(f"Unknown chat LLM provider: {provider!r}", status_code=400)

    if model is None or not model.strip():
        return get_default_model_for_provider(provider)

    model_id = model.strip()
    entry = get_model(model_id)
    if entry is None or entry["provider"] != provider:
        raise AppError(
            f"Model {model_id!r} is not available for provider {provider!r}.",
            status_code=400,
        )
    return model_id


def get_chat_provider(*, provider_name: str, model: str | None = None) -> LLMStreamProvider:
    """Build a provider instance for the given provider name."""
    settings = get_settings()
    provider = provider_name.strip().lower()
    model_id = resolve_model_id(provider_name=provider, model=model)
    cache = get_catalog_cache()
    cache.require_loaded()
    provider_entry = cache.providers.get(provider)

    if provider == "openai":
        return OpenAIProvider(api_key=settings.openai_api_key)
    if provider == "anthropic":
        return AnthropicProvider(api_key=settings.anthropic_api_key, model=model_id)
    if provider == "moonshot":
        catalog_base = provider_entry.base_url if provider_entry else None
        base_url = (
            (settings.moonshot_base_url or "").strip()
            or (catalog_base or "").strip()
            or DEFAULT_MOONSHOT_BASE_URL
        )
        return MoonshotProvider(
            api_key=settings.moonshot_api_key,
            base_url=base_url,
        )

    raise AppError(f"Unknown chat LLM provider: {provider!r}", status_code=500)


def get_active_model(*, provider_name: str, model: str | None = None) -> str:
    """Return the resolved model id for the given provider."""
    return resolve_model_id(provider_name=provider_name, model=model)
