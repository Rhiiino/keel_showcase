# keel_api/src/modules/focus/reference_registry/types.py

"""Reference type metadata and registry definitions."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

# Default reference types enabled. Controls which types are available in the record reference picker.
LEGACY_REFERENCE_ENABLED_TYPES: frozenset[str] = frozenset(
    {
        "project",
        "finance_transaction",
        "contact",
        "figure",
        "agent",
        "tool",
        "tool_category",
    }
)
DEFAULT_REFERENCE_ENABLED_TYPES: frozenset[str] = frozenset(
    {
        "project",
        "finance_transaction",
        "contact",
        "figure",
        "agent",
        "media_object",
        "tool",
        "tool_category",
    }
)


@dataclass(frozen=True)
class ReferenceTypeMeta:
    target_type: str
    display_name: str
    user_scoped: bool
    web_path: Callable[[str], str | None]


@dataclass(frozen=True)
class ReferencePropertyDef:
    key: str
    label: str


# Controls which properties are displayed in the reference detail inspector.
REFERENCE_PROPERTY_MANIFESTS: dict[str, list[ReferencePropertyDef]] = {
    "project": [
        ReferencePropertyDef("title", "Title"),
        ReferencePropertyDef("status", "Status"),
        ReferencePropertyDef("updated_at", "Updated"),
    ],
    "finance_transaction": [
        ReferencePropertyDef("title", "Title"),
        ReferencePropertyDef("kind", "Kind"),
        ReferencePropertyDef("status", "Status"),
        ReferencePropertyDef("updated_at", "Updated"),
    ],
    "contact": [
        ReferencePropertyDef("name", "Name"),
        ReferencePropertyDef("status", "Status"),
        ReferencePropertyDef("updated_at", "Updated"),
    ],
    "figure": [
        ReferencePropertyDef("name", "Name"),
        ReferencePropertyDef("status", "Status"),
        ReferencePropertyDef("updated_at", "Updated"),
    ],
    "agent": [
        ReferencePropertyDef("display_name", "Display name"),
        ReferencePropertyDef("key", "Key"),
    ],
    "media_object": [
        ReferencePropertyDef("original_filename", "Filename"),
        ReferencePropertyDef("media_kind", "Kind"),
        ReferencePropertyDef("mime_type", "MIME type"),
        ReferencePropertyDef("byte_size", "Bytes"),
        ReferencePropertyDef("updated_at", "Updated"),
    ],
    "tool": [
        ReferencePropertyDef("name", "Name"),
        ReferencePropertyDef("category_name", "Category"),
    ],
    "tool_category": [
        ReferencePropertyDef("display_name", "Display name"),
        ReferencePropertyDef("key", "Key"),
    ],
}


REFERENCE_TYPES: dict[str, ReferenceTypeMeta] = {
    "project": ReferenceTypeMeta(
        target_type="project",
        display_name="Project",
        user_scoped=True,
        web_path=lambda target_id: f"/projects/{target_id}",
    ),
    "finance_transaction": ReferenceTypeMeta(
        target_type="finance_transaction",
        display_name="Transaction",
        user_scoped=True,
        web_path=lambda target_id: f"/finance/transactions/{target_id}",
    ),
    "contact": ReferenceTypeMeta(
        target_type="contact",
        display_name="Contact",
        user_scoped=False,
        web_path=lambda target_id: f"/people/contacts/{target_id}",
    ),
    "figure": ReferenceTypeMeta(
        target_type="figure",
        display_name="Figure",
        user_scoped=False,
        web_path=lambda target_id: f"/people/figures/{target_id}",
    ),
    "agent": ReferenceTypeMeta(
        target_type="agent",
        display_name="Agent",
        user_scoped=False,
        web_path=lambda target_id: f"/agents/{target_id}",
    ),
    "media_object": ReferenceTypeMeta(
        target_type="media_object",
        display_name="Media object",
        user_scoped=True,
        web_path=lambda target_id: f"/media/{target_id}",
    ),
    "tool": ReferenceTypeMeta(
        target_type="tool",
        display_name="Tool",
        user_scoped=False,
        web_path=lambda _target_id: None,
    ),
    "tool_category": ReferenceTypeMeta(
        target_type="tool_category",
        display_name="Tool categories",
        user_scoped=False,
        web_path=lambda _target_id: None,
    ),
}



def all_reference_type_metas() -> list[ReferenceTypeMeta]:
    """Return registered reference types in stable order."""
    return [REFERENCE_TYPES[key] for key in sorted(REFERENCE_TYPES)]


def get_reference_type_meta(target_type: str) -> ReferenceTypeMeta | None:
    """Look up one reference type definition."""
    return REFERENCE_TYPES.get(target_type)


def reference_property_manifest(target_type: str) -> list[ReferencePropertyDef]:
    """Return curated inspector properties for one reference type."""
    return list(REFERENCE_PROPERTY_MANIFESTS.get(target_type, []))


def normalize_enabled_types(enabled_types: list[str] | None) -> list[str]:
    """Filter enabled types to registered keys; default to all when unset."""
    if not enabled_types:
        return sorted(DEFAULT_REFERENCE_ENABLED_TYPES)
    if set(enabled_types) == LEGACY_REFERENCE_ENABLED_TYPES:
        return sorted(DEFAULT_REFERENCE_ENABLED_TYPES)
    seen: set[str] = set()
    normalized: list[str] = []
    for target_type in enabled_types:
        if target_type in REFERENCE_TYPES and target_type not in seen:
            seen.add(target_type)
            normalized.append(target_type)
    return normalized or sorted(DEFAULT_REFERENCE_ENABLED_TYPES)
