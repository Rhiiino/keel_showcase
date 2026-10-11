# keel_api/src/llm/tools/native/coak/update_coak_item.py

from __future__ import annotations

from typing import Any

from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import (
    build_item_update,
    dump_model,
    require_item_id,
    require_record_id,
)
from modules.coak.service import items as items_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update a Coak directory item."""
    record_id = require_record_id(arguments)
    item_id = require_item_id(arguments)
    payload = build_item_update(arguments)
    updated = await items_service.update_item(
        context.user_id,
        record_id,
        item_id,
        payload,
    )
    return {"item": dump_model(updated)}


TOOL_DEFINITION = ToolDefinition(
    name="update_coak_item",
    category=COAK,
    description=(
        "Update a Coak directory item. Supports renaming, moving, color changes, "
        "note/flash content, note-to-folder promotion, media attachment, and tag "
        "assignment. When tag_ids is provided it replaces all existing tags."
    ),
    parameters={
        "type": "object",
        "properties": {
            "record_id": {"type": "integer"},
            "item_id": {"type": "integer"},
            "kind": {
                "type": "string",
                "enum": ["folder", "note", "flash"],
                "description": "Only note items can be promoted to folder.",
            },
            "name": {"type": "string"},
            "parent_id": {
                "type": ["integer", "null"],
                "description": "Move item to another folder; null for record root.",
            },
            "color_hex": {"type": ["string", "null"]},
            "sort_order": {"type": "integer"},
            "media_id": {
                "type": ["string", "null"],
                "description": "Media attachment UUID; null detaches.",
            },
            "note_body": {"type": "string"},
            "flash_front": {"type": "string"},
            "flash_back": {"type": "string"},
            "tag_ids": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "Replace all tag assignments when provided.",
            },
        },
        "required": ["record_id", "item_id"],
        "additionalProperties": False,
    },
    returns="{ item: object }",
    executor=execute,
)
