# keel_api/src/modules/deleted/test_trash_handlers.py

"""Smoke tests for deleted handler registry."""

from __future__ import annotations

from modules.deleted import entity_types
from modules.deleted.handlers.registry import get_handler, handlers_by_type


def test_handlers_cover_core_entity_types() -> None:
    expected = {
        entity_types.CONTACT,
        entity_types.TIMELINE_EVENT,
        entity_types.MEDIA,
        entity_types.COAK_RECORD,
        entity_types.CHAT_CONVERSATION,
    }
    assert expected.issubset(set(handlers_by_type.keys()))


def test_get_handler_returns_contact_handler() -> None:
    handler = get_handler(entity_types.CONTACT)
    assert handler.entity_type == entity_types.CONTACT
