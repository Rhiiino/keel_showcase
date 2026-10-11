# stack_sandbox/backend/src/llm/tools/native/figures/_figures.py

"""Shared helpers for figures native tools."""

from __future__ import annotations

from datetime import date
from typing import Any

from pydantic import BaseModel


def dump_model(model: BaseModel) -> dict[str, Any]:
    return model.model_dump(mode="json")


def dump_models(models: list[BaseModel]) -> list[dict[str, Any]]:
    return [dump_model(model) for model in models]


def optional_str(arguments: dict[str, Any], key: str) -> str | None:
    if key not in arguments:
        return None
    value = arguments.get(key)
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError(f"{key} must be a string")
    return value


def optional_bool(arguments: dict[str, Any], key: str) -> bool | None:
    if key not in arguments:
        return None
    value = arguments.get(key)
    if value is None:
        return None
    if not isinstance(value, bool):
        raise ValueError(f"{key} must be a boolean")
    return value


def optional_date(arguments: dict[str, Any], key: str) -> date | None:
    if key not in arguments:
        return None
    value = arguments.get(key)
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{key} must be an ISO date string (YYYY-MM-DD)")
    return date.fromisoformat(value.strip())


PERSON_FIELD_PROPERTIES: dict[str, dict[str, Any]] = {
    "first_name": {"type": "string"},
    "last_name": {"type": "string"},
    "gender": {"type": "string", "enum": ["male", "female"]},
    "birth_date": {
        "type": "string",
        "description": "ISO date YYYY-MM-DD.",
    },
    "birth_date_year_known": {"type": "boolean"},
    "death_date": {
        "type": "string",
        "description": "ISO date YYYY-MM-DD.",
    },
    "notes": {"type": "string"},
    "status": {"type": "string", "enum": ["active", "archived"]},
}
