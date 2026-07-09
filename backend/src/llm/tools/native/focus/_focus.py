# keel_api/src/llm/tools/native/focus/_focus.py

"""Shared helpers for Focus tool executors."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel


def dump_model(model: BaseModel | dict[str, Any]) -> dict[str, Any]:
    """Serialize a Focus model or legacy dict to a JSON-compatible dict."""
    if isinstance(model, dict):
        return model
    return model.model_dump(mode="json")


def dump_models(models: list[BaseModel | dict[str, Any]]) -> list[dict[str, Any]]:
    """Serialize a list of Focus models or dicts."""
    return [dump_model(model) for model in models]
