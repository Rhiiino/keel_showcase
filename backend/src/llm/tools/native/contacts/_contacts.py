# stack_sandbox/backend/src/llm/tools/native/contacts/_contacts.py

"""Shared helpers for contacts native tools."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel


def dump_model(model: BaseModel) -> dict[str, Any]:
    return model.model_dump(mode="json")


def dump_models(models: list[BaseModel]) -> list[dict[str, Any]]:
    return [dump_model(model) for model in models]
