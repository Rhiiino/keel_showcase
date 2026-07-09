# keel_api/src/app_modules/types.py
"""Shared types for backend module registration."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field

from fastapi import APIRouter


def _always_enabled() -> bool:
    # TODO: Implement actual enabled check once module specific authorization is implemented.
    return True


@dataclass(frozen=True)
class ModuleRegistration:
    key: str
    router: APIRouter
    enabled: Callable[[], bool] = field(default=_always_enabled)
