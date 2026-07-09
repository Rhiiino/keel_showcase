# keel_api/src/modules/deleted/entity_types.py
"""Stable entity_type strings stored in deleted_records."""

from __future__ import annotations

CONTACT = "contact"
CONTACT_RELATIONSHIP = "contact_relationship"
CONTACT_TAG = "contact_tag"

FIGURE = "figure"

TIMELINE_EVENT = "timeline_event"
TIMELINE_TAG = "timeline_tag"

JOURNAL_ENTRY = "journal_entry"
JOURNAL_TAG = "journal_tag"

FINANCE_TRANSACTION = "finance_transaction"
FINANCE_VENDOR = "finance_vendor"
FINANCE_TRANSACTION_TAG = "finance_transaction_tag"
FINANCE_OBLIGATION = "finance_obligation"
FINANCE_PAYMENT_METHOD = "finance_payment_method"
FINANCE_OBLIGATION_TAG = "finance_obligation_tag"

FOCUS_NODE = "focus_node"
FOCUS_TAG = "focus_tag"

MEDIA = "media"
MEDIA_FOLDER = "media_folder"
MEDIA_ATTACHMENT = "media_attachment"
MEDIA_PANEL = "media_panel"
MEDIA_PANEL_ITEM = "media_panel_item"

PROJECT = "project"
PROJECT_TAG = "project_tag"
PROJECT_CANVAS = "project_canvas"
PROJECT_FOLDER = "project_folder"

COAK_RECORD = "coak_record"
COAK_ITEM = "coak_item"
COAK_TAG = "coak_tag"

CHAT_CONVERSATION = "chat_conversation"

ALL_ENTITY_TYPES: frozenset[str] = frozenset(
    {
        CONTACT,
        CONTACT_RELATIONSHIP,
        CONTACT_TAG,
        TIMELINE_EVENT,
        TIMELINE_TAG,
        JOURNAL_ENTRY,
        JOURNAL_TAG,
        FINANCE_TRANSACTION,
        FINANCE_VENDOR,
        FINANCE_TRANSACTION_TAG,
        FINANCE_OBLIGATION,
        FINANCE_PAYMENT_METHOD,
        FINANCE_OBLIGATION_TAG,
        FOCUS_NODE,
        FOCUS_TAG,
        MEDIA,
        MEDIA_FOLDER,
        MEDIA_ATTACHMENT,
        MEDIA_PANEL,
        MEDIA_PANEL_ITEM,
        PROJECT,
        PROJECT_TAG,
        PROJECT_CANVAS,
        PROJECT_FOLDER,
        COAK_RECORD,
        COAK_ITEM,
        COAK_TAG,
        CHAT_CONVERSATION,
    }
)
