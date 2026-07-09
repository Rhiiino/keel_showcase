# keel_api/src/llm/tools/native/haul/_haul.py

"""Shared helpers for Haul (shop) tool executors."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from core.errors import AppError
from pydantic import BaseModel


def dump_model(model: BaseModel) -> dict[str, Any]:
    """Serialize a shop Pydantic model to a JSON-compatible dict."""
    return model.model_dump(mode="json")


def dump_models(models: list[BaseModel]) -> list[dict[str, Any]]:
    """Serialize a list of shop Pydantic models to dicts."""
    return [dump_model(m) for m in models]


def require_transaction_id(arguments: dict[str, Any]) -> int:
    """Validate and return transaction_id from tool arguments."""
    transaction_id = arguments.get("transaction_id")
    if isinstance(transaction_id, int) and transaction_id >= 1:
        return transaction_id
    raise AppError("transaction_id must be a positive integer.", status_code=400)


def require_vendor_id(arguments: dict[str, Any]) -> int:
    """Validate and return vendor_id from tool arguments."""
    vendor_id = arguments.get("vendor_id")
    if isinstance(vendor_id, int) and vendor_id >= 1:
        return vendor_id
    raise AppError("vendor_id must be a positive integer.", status_code=400)


def require_media_id(arguments: dict[str, Any]) -> UUID:
    """Validate and return media_id (UUID) from tool arguments."""
    raw = arguments.get("media_id")
    if isinstance(raw, UUID):
        return raw
    if isinstance(raw, str):
        try:
            return UUID(raw.strip())
        except ValueError as exc:
            raise AppError("media_id must be a valid UUID.", status_code=400) from exc
    raise AppError("media_id must be a UUID string.", status_code=400)
