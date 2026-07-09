# keel_api/src/modules/connectors/focus/manifest.py

"""Focus connector tool definitions."""

from __future__ import annotations

from typing import Any

from modules.connectors import config as connector_config
from modules.connectors.focus.prompt import FOCUS_CONNECTOR_DOMAIN_PROMPT

ToolDefinition = dict[str, Any]


def _tool(
    *,
    name: str,
    description: str,
    scope: str,
    mutates: bool,
    parameters: dict[str, Any],
) -> ToolDefinition:
    return {
        "name": name,
        "description": description,
        "scope": scope,
        "mutates": mutates,
        "parameters": parameters,
    }


FOCUS_CONNECTOR_TOOLS: list[ToolDefinition] = [
    _tool(
        name="list_focus_nodes",
        description="List focus nodes with optional filters.",
        scope=connector_config.SCOPE_FOCUS_READ,
        mutates=False,
        parameters={
            "type": "object",
            "properties": {
                "parent_id": {"type": "integer", "minimum": 1},
                "roots_only": {"type": "boolean"},
                "kind": {"type": "string"},
                "kinds": {"type": "array", "items": {"type": "string"}},
                "status": {"type": "string"},
                "hub_lists_only": {"type": "boolean"},
            },
            "additionalProperties": False,
        },
    ),
    _tool(
        name="get_focus_node",
        description="Fetch one focus node, optionally including its subtree.",
        scope=connector_config.SCOPE_FOCUS_READ,
        mutates=False,
        parameters={
            "type": "object",
            "required": ["node_id"],
            "properties": {
                "node_id": {"type": "integer", "minimum": 1},
                "include_subtree": {"type": "boolean"},
            },
            "additionalProperties": False,
        },
    ),
    _tool(
        name="create_focus_node",
        description="Create an item, list, or record node.",
        scope=connector_config.SCOPE_FOCUS_WRITE,
        mutates=True,
        parameters={
            "type": "object",
            "required": ["kind", "title"],
            "properties": {
                "kind": {"type": "string"},
                "title": {"type": "string", "minLength": 1},
                "parent_id": {"type": "integer", "minimum": 1},
                "sort_order": {"type": "integer", "minimum": 0},
                "notes": {"type": "string"},
                "status": {"type": "string"},
                "work_order": {"type": "integer", "minimum": 0},
                "node_color_hex": {"type": "string"},
                "title_font_key": {"type": "string"},
                "is_origin": {"type": "boolean"},
                "tag_ids": {"type": "array", "items": {"type": "integer", "minimum": 1}},
                "reference_target_type": {"type": "string"},
                "reference_target_id": {"type": "integer", "minimum": 1},
            },
            "additionalProperties": False,
        },
    ),
    _tool(
        name="update_focus_node",
        description="Update one focus node.",
        scope=connector_config.SCOPE_FOCUS_WRITE,
        mutates=True,
        parameters={
            "type": "object",
            "required": ["node_id"],
            "properties": {
                "node_id": {"type": "integer", "minimum": 1},
                "kind": {"type": "string"},
                "title": {"type": "string", "minLength": 1},
                "parent_id": {"type": ["integer", "null"], "minimum": 1},
                "sort_order": {"type": "integer", "minimum": 0},
                "notes": {"type": "string"},
                "status": {"type": "string"},
                "work_order": {"type": "integer", "minimum": 0},
                "node_color_hex": {"type": "string"},
                "title_font_key": {"type": "string"},
                "is_origin": {"type": "boolean"},
                "tag_ids": {"type": "array", "items": {"type": "integer", "minimum": 1}},
                "reference_target_type": {"type": "string"},
                "reference_target_id": {"type": "integer", "minimum": 1},
            },
            "additionalProperties": False,
        },
    ),
    _tool(
        name="delete_focus_node",
        description="Delete one focus node and its descendants.",
        scope=connector_config.SCOPE_FOCUS_DELETE,
        mutates=True,
        parameters={
            "type": "object",
            "required": ["node_id"],
            "properties": {
                "node_id": {"type": "integer", "minimum": 1},
            },
            "additionalProperties": False,
        },
    ),
    _tool(
        name="complete_focus_node",
        description="Mark one item node as completed.",
        scope=connector_config.SCOPE_FOCUS_WRITE,
        mutates=True,
        parameters={
            "type": "object",
            "required": ["node_id"],
            "properties": {
                "node_id": {"type": "integer", "minimum": 1},
            },
            "additionalProperties": False,
        },
    ),
    _tool(
        name="reorder_focus_nodes",
        description="Update sort order for sibling nodes.",
        scope=connector_config.SCOPE_FOCUS_WRITE,
        mutates=True,
        parameters={
            "type": "object",
            "required": ["entries"],
            "properties": {
                "entries": {
                    "type": "array",
                    "minItems": 1,
                    "items": {
                        "type": "object",
                        "required": ["id", "sort_order"],
                        "properties": {
                            "id": {"type": "integer", "minimum": 1},
                            "sort_order": {"type": "integer", "minimum": 0},
                        },
                        "additionalProperties": False,
                    },
                }
            },
            "additionalProperties": False,
        },
    ),
    _tool(
        name="list_focus_tags",
        description="List the current user's focus tags.",
        scope=connector_config.SCOPE_FOCUS_READ,
        mutates=False,
        parameters={"type": "object", "properties": {}, "additionalProperties": False},
    ),
    _tool(
        name="create_focus_tag",
        description="Create a focus tag.",
        scope=connector_config.SCOPE_FOCUS_WRITE,
        mutates=True,
        parameters={
            "type": "object",
            "required": ["name"],
            "properties": {
                "name": {"type": "string", "minLength": 1},
                "color_hex": {"type": "string"},
            },
            "additionalProperties": False,
        },
    ),
    _tool(
        name="update_focus_tag",
        description="Update one focus tag.",
        scope=connector_config.SCOPE_FOCUS_WRITE,
        mutates=True,
        parameters={
            "type": "object",
            "required": ["tag_id"],
            "properties": {
                "tag_id": {"type": "integer", "minimum": 1},
                "name": {"type": "string", "minLength": 1},
                "color_hex": {"type": "string"},
            },
            "additionalProperties": False,
        },
    ),
    _tool(
        name="delete_focus_tag",
        description="Delete one focus tag.",
        scope=connector_config.SCOPE_FOCUS_DELETE,
        mutates=True,
        parameters={
            "type": "object",
            "required": ["tag_id"],
            "properties": {
                "tag_id": {"type": "integer", "minimum": 1},
            },
            "additionalProperties": False,
        },
    ),
    _tool(
        name="search_focus_references",
        description="Search external records for the Focus reference picker.",
        scope=connector_config.SCOPE_FOCUS_READ,
        mutates=False,
        parameters={
            "type": "object",
            "required": ["type"],
            "properties": {
                "type": {"type": "string"},
                "q": {"type": "string"},
            },
            "additionalProperties": False,
        },
    ),
    _tool(
        name="get_focus_reference_detail",
        description="Return curated properties for one linked reference record.",
        scope=connector_config.SCOPE_FOCUS_READ,
        mutates=False,
        parameters={
            "type": "object",
            "required": ["type", "id"],
            "properties": {
                "type": {"type": "string"},
                "id": {"type": "integer", "minimum": 1},
            },
            "additionalProperties": False,
        },
    ),
    _tool(
        name="highlight_focus_nodes",
        description="Highlight multiple focus nodes on the constellation canvas and frame them in view.",
        scope=connector_config.SCOPE_FOCUS_READ,
        mutates=False,
        parameters={
            "type": "object",
            "required": ["node_ids"],
            "properties": {
                "node_ids": {
                    "type": "array",
                    "minItems": 1,
                    "items": {"type": "integer", "minimum": 1},
                },
            },
            "additionalProperties": False,
        },
    ),
    _tool(
        name="set_focus_constellation_node_expanded",
        description="Fold or unfold one constellation node so its children are hidden or shown.",
        scope=connector_config.SCOPE_FOCUS_READ,
        mutates=False,
        parameters={
            "type": "object",
            "required": ["node_id", "expanded"],
            "properties": {
                "node_id": {"type": "integer", "minimum": 1},
                "expanded": {"type": "boolean"},
            },
            "additionalProperties": False,
        },
    ),
    _tool(
        name="get_focus_constellation_layout",
        description="Return visible constellation canvas nodes, edges, and stored positions.",
        scope=connector_config.SCOPE_FOCUS_READ,
        mutates=False,
        parameters={"type": "object", "properties": {}, "additionalProperties": False},
    ),
    _tool(
        name="align_focus_constellation_children",
        description="Evenly redistribute a container node's children around it on the constellation canvas.",
        scope=connector_config.SCOPE_FOCUS_READ,
        mutates=False,
        parameters={
            "type": "object",
            "required": ["parent_id"],
            "properties": {
                "parent_id": {"type": "integer", "minimum": 1},
            },
            "additionalProperties": False,
        },
    ),
    _tool(
        name="place_focus_constellation_node",
        description="Place one constellation node using semantic placement relative to its parent.",
        scope=connector_config.SCOPE_FOCUS_WRITE,
        mutates=True,
        parameters={
            "type": "object",
            "required": ["node_id", "placement"],
            "properties": {
                "node_id": {"type": "integer", "minimum": 1},
                "placement": {
                    "type": "object",
                    "required": ["mode"],
                    "properties": {
                        "mode": {
                            "type": "string",
                            "enum": ["relative_to_parent", "away_from_grandparent"],
                        },
                        "angle_degrees": {"type": "number"},
                        "distance": {
                            "oneOf": [
                                {"type": "string", "enum": ["default"]},
                                {"type": "number", "minimum": 1},
                            ],
                        },
                    },
                    "additionalProperties": False,
                },
            },
            "additionalProperties": False,
        },
    ),
]

FOCUS_CONNECTOR_TOOL_NAMES: frozenset[str] = frozenset(
    tool["name"] for tool in FOCUS_CONNECTOR_TOOLS
)


def get_tool_definition(tool_name: str) -> ToolDefinition | None:
    for tool in FOCUS_CONNECTOR_TOOLS:
        if tool["name"] == tool_name:
            return tool
    return None


def build_focus_manifest() -> dict[str, Any]:
    return {
        "connector": "focus",
        "domain_prompt": FOCUS_CONNECTOR_DOMAIN_PROMPT,
        "tools": FOCUS_CONNECTOR_TOOLS,
        "auth": {
            "type": "bearer",
            "header": "Authorization: Bearer <token>",
            "session_endpoint": "/connectors/focus/sessions",
            "tool_invoke_endpoint": "/connectors/focus/tools/{tool_name}/invoke",
            "events_endpoint": "/connectors/focus/events",
        },
    }
