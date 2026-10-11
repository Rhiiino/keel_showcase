# keel_api/src/llm/tools/native/coak/_coak.py

"""Shared helpers for Coak tool executors."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel

from core.errors import AppError
from modules.coak.schemas import CoakItemUpdate


def dump_model(model: BaseModel | dict[str, Any]) -> dict[str, Any]:
    """Serialize a Coak model or legacy dict to a JSON-compatible dict."""
    if isinstance(model, dict):
        return model
    return model.model_dump(mode="json")


def dump_models(models: list[BaseModel | dict[str, Any]]) -> list[dict[str, Any]]:
    """Serialize a list of Coak models or dicts."""
    return [dump_model(model) for model in models]


def require_record_id(arguments: dict[str, Any]) -> int:
    record_id = arguments.get("record_id")
    if not isinstance(record_id, int) or record_id < 1:
        raise AppError("record_id must be a positive integer.", status_code=400)
    return record_id


def require_item_id(arguments: dict[str, Any]) -> int:
    item_id = arguments.get("item_id")
    if not isinstance(item_id, int) or item_id < 1:
        raise AppError("item_id must be a positive integer.", status_code=400)
    return item_id


def require_tag_id(arguments: dict[str, Any]) -> int:
    tag_id = arguments.get("tag_id")
    if not isinstance(tag_id, int) or tag_id < 1:
        raise AppError("tag_id must be a positive integer.", status_code=400)
    return tag_id


def parse_tag_ids(raw: object) -> list[int]:
    if not isinstance(raw, list):
        raise AppError("tag_ids must be an array of integers.", status_code=400)
    tag_ids: list[int] = []
    for item in raw:
        if not isinstance(item, int) or item < 1:
            raise AppError("tag_ids must contain positive integers.", status_code=400)
        tag_ids.append(item)
    return tag_ids


def parse_media_id(raw: object) -> UUID | None:
    if raw is None:
        return None
    if not isinstance(raw, str) or not raw.strip():
        raise AppError("media_id must be a UUID string or null.", status_code=400)
    try:
        return UUID(raw.strip())
    except ValueError as exc:
        raise AppError("media_id must be a valid UUID.", status_code=400) from exc


def build_item_update(arguments: dict[str, Any]) -> CoakItemUpdate:
    """Build a partial CoakItemUpdate from only the keys the agent provided."""
    fields: dict[str, Any] = {}
    if "kind" in arguments:
        fields["kind"] = arguments["kind"]
    if "name" in arguments:
        fields["name"] = arguments["name"]
    if "parent_id" in arguments:
        fields["parent_id"] = arguments["parent_id"]
    if "color_hex" in arguments:
        fields["color_hex"] = arguments["color_hex"]
    if "sort_order" in arguments:
        fields["sort_order"] = arguments["sort_order"]
    if "media_id" in arguments:
        fields["media_id"] = parse_media_id(arguments["media_id"])
    if "note_body" in arguments:
        fields["note_body"] = arguments["note_body"]
    if "flash_front" in arguments:
        fields["flash_front"] = arguments["flash_front"]
    if "flash_back" in arguments:
        fields["flash_back"] = arguments["flash_back"]
    if "tag_ids" in arguments:
        fields["tag_ids"] = parse_tag_ids(arguments["tag_ids"])
    return CoakItemUpdate(**fields)
