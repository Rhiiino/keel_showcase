# keel_api/src/llm/tools/native/coak/update_coak_workspace_state.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import dump_model, require_record_id
from modules.coak.schemas import CoakCameraState, CoakNodePosition, CoakWorkspaceStateUpdate
from modules.coak.service import workspace_state as workspace_state_service


def _parse_node_positions(raw: object) -> list[CoakNodePosition]:
    if not isinstance(raw, list):
        raise AppError("node_positions must be an array.", status_code=400)
    positions: list[CoakNodePosition] = []
    for item in raw:
        if not isinstance(item, dict):
            raise AppError("Each node position must be an object.", status_code=400)
        item_id = item.get("item_id")
        x = item.get("x")
        y = item.get("y")
        z = item.get("z")
        if not isinstance(item_id, int) or item_id < 1:
            raise AppError("node_positions item_id must be a positive integer.", status_code=400)
        if not all(isinstance(value, (int, float)) for value in (x, y, z)):
            raise AppError("node_positions x, y, z must be numbers.", status_code=400)
        positions.append(
            CoakNodePosition(item_id=item_id, x=float(x), y=float(y), z=float(z)),
        )
    return positions


def _parse_id_list(raw: object, field_name: str) -> list[int]:
    if not isinstance(raw, list):
        raise AppError(f"{field_name} must be an array.", status_code=400)
    ids: list[int] = []
    for item in raw:
        if not isinstance(item, int) or item < 1:
            raise AppError(f"{field_name} must contain positive integers.", status_code=400)
        ids.append(item)
    return ids


def _parse_camera(raw: object) -> CoakCameraState | None:
    if raw is None:
        return None
    if not isinstance(raw, dict):
        raise AppError("camera must be an object or null.", status_code=400)
    distance = raw.get("distance")
    polar_angle = raw.get("polar_angle")
    azimuth_angle = raw.get("azimuth_angle")
    if not all(isinstance(value, (int, float)) for value in (distance, polar_angle, azimuth_angle)):
        raise AppError("camera distance, polar_angle, and azimuth_angle must be numbers.", status_code=400)
    return CoakCameraState(
        distance=float(distance),
        polar_angle=float(polar_angle),
        azimuth_angle=float(azimuth_angle),
    )


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update constellation workspace layout for a Coak record."""
    record_id = require_record_id(arguments)
    state_version = arguments.get("state_version")
    if not isinstance(state_version, int):
        raise AppError("state_version is required and must be an integer.", status_code=400)

    payload = CoakWorkspaceStateUpdate(
        state_version=state_version,
        node_positions=_parse_node_positions(arguments.get("node_positions", [])),
        expanded_folder_ids=_parse_id_list(
            arguments.get("expanded_folder_ids", []),
            "expanded_folder_ids",
        ),
        pinned_item_ids=_parse_id_list(
            arguments.get("pinned_item_ids", []),
            "pinned_item_ids",
        ),
        camera=_parse_camera(arguments.get("camera")),
    )
    updated = await workspace_state_service.update_workspace_state(
        context.user_id,
        record_id,
        payload,
    )
    return {"workspace_state": dump_model(updated)}


TOOL_DEFINITION = ToolDefinition(
    name="update_coak_workspace_state",
    category=COAK,
    description=(
        "Update the constellation workspace layout for a Coak record: node positions, "
        "expanded folders, pinned items, and camera."
    ),
    parameters={
        "type": "object",
        "properties": {
            "record_id": {"type": "integer"},
            "state_version": {
                "type": "integer",
                "description": "Workspace state schema version (use 1).",
            },
            "node_positions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "item_id": {"type": "integer"},
                        "x": {"type": "number"},
                        "y": {"type": "number"},
                        "z": {"type": "number"},
                    },
                    "required": ["item_id", "x", "y", "z"],
                    "additionalProperties": False,
                },
            },
            "expanded_folder_ids": {
                "type": "array",
                "items": {"type": "integer"},
            },
            "pinned_item_ids": {
                "type": "array",
                "items": {"type": "integer"},
            },
            "camera": {
                "type": ["object", "null"],
                "properties": {
                    "distance": {"type": "number"},
                    "polar_angle": {"type": "number"},
                    "azimuth_angle": {"type": "number"},
                },
                "required": ["distance", "polar_angle", "azimuth_angle"],
                "additionalProperties": False,
            },
        },
        "required": ["record_id", "state_version"],
        "additionalProperties": False,
    },
    returns="{ workspace_state: object }",
    executor=execute,
)
