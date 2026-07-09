# keel_api/src/modules/settings/test_home_card_defaults.py

"""Tests for new-user home card visibility defaults."""

from __future__ import annotations

from modules.settings import config


def test_default_home_card_visibility_all_hidden() -> None:
    visibility = config.default_home_card_visibility_all_hidden()
    assert set(visibility.keys()) == set(config.ALLOWED_HOME_CARD_IDS)
    assert all(value is False for value in visibility.values())
