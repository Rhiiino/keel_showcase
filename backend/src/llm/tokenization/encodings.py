# stack_sandbox/backend/src/llm/tokenization/encodings.py

"""Resolve tiktoken encodings for provider/model pairs."""

from __future__ import annotations

import tiktoken
from tiktoken.core import Encoding


def _uses_o200k_encoding(model_id: str) -> bool:
    """Heuristic for models that use the o200k tiktoken encoding."""
    normalized = model_id.strip().lower()
    return (
        normalized.startswith("gpt-5")
        or normalized.startswith("gpt-4.1")
        or normalized.startswith("o3")
        or normalized.startswith("o4")
    )


def resolve_encoding(provider: str, model_id: str) -> tuple[Encoding, bool]:
    """Return (encoding, is_estimate).

    OpenAI and Moonshot use tiktoken with model-aware resolution when possible.
    Anthropic uses cl100k_base as an approximate stand-in.
    """
    normalized_provider = provider.strip().lower()
    normalized_model = model_id.strip().lower()

    if normalized_provider == "anthropic":
        return tiktoken.get_encoding("cl100k_base"), True

    if normalized_provider in {"openai", "moonshot"}:
        try:
            return tiktoken.encoding_for_model(normalized_model), False
        except KeyError:
            if _uses_o200k_encoding(normalized_model):
                return tiktoken.get_encoding("o200k_base"), False
            return tiktoken.get_encoding("cl100k_base"), True

    return tiktoken.get_encoding("cl100k_base"), True
