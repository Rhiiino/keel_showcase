# keel_api/src/llm/tools/native/coak/create_coak_item.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import dump_model, parse_media_id, parse_tag_ids, require_record_id
from modules.coak.schemas import CoakItemCreate
from modules.coak.service import items as items_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Create a Coak directory item."""
    record_id = require_record_id(arguments)
    kind = arguments.get("kind")
    if kind not in ("folder", "note", "flash"):
        raise AppError("kind must be folder, note, or flash.", status_code=400)
    name = arguments.get("name")
    if not isinstance(name, str) or not name.strip():
        raise AppError("name is required.", status_code=400)

    tag_ids: list[int] = []
    if "tag_ids" in arguments:
        tag_ids = parse_tag_ids(arguments["tag_ids"])

    media_id = None
    if "media_id" in arguments:
        media_id = parse_media_id(arguments["media_id"])

    payload = CoakItemCreate(
        kind=kind,
        name=name.strip(),
        parent_id=arguments.get("parent_id"),
        color_hex=arguments.get("color_hex"),
        sort_order=arguments.get("sort_order"),
        media_id=media_id,
        note_body=arguments.get("note_body"),
        flash_front=arguments.get("flash_front"),
        flash_back=arguments.get("flash_back"),
        tag_ids=tag_ids,
    )
    created = await items_service.create_item(context.user_id, record_id, payload)
    return {"item": dump_model(created)}


TOOL_DEFINITION = ToolDefinition(
    name="create_coak_item",
    category=COAK,
    description="Create a Coak directory item (folder, note, or flash card).",
    parameters={
        "type": "object",
        "properties": {
            "record_id": {"type": "integer"},
            "kind": {
                "type": "string",
                "enum": ["folder", "note", "flash"],
            },
            "name": {"type": "string"},
            "parent_id": {
                "type": ["integer", "null"],
                "description": "Parent folder id; null for record root.",
            },
            "color_hex": {"type": ["string", "null"]},
            "sort_order": {"type": "integer"},
            "media_id": {
                "type": ["string", "null"],
                "description": "Optional media attachment UUID.",
            },
            "note_body": {"type": "string"},
            "flash_front": {"type": "string"},
            "flash_back": {"type": "string"},
            "tag_ids": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "Optional tag ids to assign.",
            },
        },
        "required": ["record_id", "kind", "name"],
        "additionalProperties": False,
    },
    returns="{ item: object }",
    executor=execute,
)
