# keel_api/src/modules/focus/reference_registry/formatting.py

"""Format reference property values for display."""

from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal

import asyncpg

from modules.focus.reference_registry.types import reference_property_manifest


def contact_display_name(first_name: str | None, last_name: str | None) -> str:
    parts = [part.strip() for part in (first_name, last_name) if part and part.strip()]
    return " ".join(parts) if parts else "Contact"


def format_reference_property_value(value: object | None) -> str:
    if value is None:
        return "—"
    if isinstance(value, datetime):
        normalized = value if value.tzinfo is not None else value.replace(tzinfo=UTC)
        return normalized.astimezone().strftime("%Y-%m-%d %H:%M")
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        normalized = value.normalize()
        text = format(normalized, "f")
        return text.rstrip("0").rstrip(".") if "." in text else text
    text = str(value).strip()
    return text if text else "—"


def resolve_reference_properties(
    target_type: str,
    row: asyncpg.Record,
) -> list[dict[str, str]]:
    properties: list[dict[str, str]] = []
    for prop in reference_property_manifest(target_type):
        if prop.key == "name" and target_type in {"contact", "figure"}:
            raw_value = contact_display_name(row.get("first_name"), row.get("last_name"))
        else:
            raw_value = row.get(prop.key)
        properties.append(
            {
                "key": prop.key,
                "label": prop.label,
                "value": format_reference_property_value(raw_value),
            }
        )
    return properties
