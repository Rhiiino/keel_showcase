# keel_api/src/modules/settings/test_nav_menu_visibility.py

"""Tests for nav menu visibility merge and normalize helpers."""

from __future__ import annotations

from modules.settings import service


def test_merge_nav_menu_visibility_hides_item() -> None:
    existing = {"nav_menu_visibility": {"finance": False}}
    merged = service._merge_nav_menu_visibility(existing, {"media": False})
    assert merged == {"finance": False, "media": False}


def test_merge_nav_menu_visibility_unhides_item() -> None:
    existing = {"nav_menu_visibility": {"finance": False, "media": False}}
    merged = service._merge_nav_menu_visibility(existing, {"finance": True})
    assert merged == {"media": False}


def test_merge_nav_menu_visibility_clears_when_all_visible() -> None:
    existing = {"nav_menu_visibility": {"finance": False}}
    merged = service._merge_nav_menu_visibility(existing, {"finance": True})
    assert merged is None


def test_normalize_nav_menu_visibility_keeps_hidden_only() -> None:
    normalized = service._normalize_nav_menu_visibility(
        {"finance": False, "media": True, "chat": False, "": False, 1: False},
    )
    assert normalized == {"finance": False, "chat": False}


def test_normalize_nav_menu_visibility_empty_returns_none() -> None:
    assert service._normalize_nav_menu_visibility({}) is None
    assert service._normalize_nav_menu_visibility(None) is None
