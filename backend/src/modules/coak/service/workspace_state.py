# keel_api/src/modules/coak/service/workspace_state.py

"""Per-record Coak workspace layout state on coak_records."""

from __future__ import annotations

from core.database import get_pool
from core.errors import AppError
from modules.coak import config
from modules.coak.repository import records as records_repository
from modules.coak.schemas import (
    CoakCameraState,
    CoakNodePosition,
    CoakWorkspaceStatePublic,
    CoakWorkspaceStateUpdate,
)
from modules.coak.service.helpers import assert_owned_record



def empty_workspace_state(*, persisted: bool = False) -> CoakWorkspaceStatePublic:
    return CoakWorkspaceStatePublic(
        state_version=config.WORKSPACE_STATE_VERSION,
        node_positions=[],
        expanded_folder_ids=[],
        pinned_item_ids=[],
        camera=None,
        persisted=persisted,
    )


def parse_node_positions(raw: object) -> list[CoakNodePosition]:
    if not isinstance(raw, list):
        return []
    positions: list[CoakNodePosition] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        item_id = item.get("item_id")
        x = item.get("x")
        y = item.get("y")
        z = item.get("z")
        if not isinstance(item_id, int) or item_id < 1:
            continue
        if not all(isinstance(value, (int, float)) for value in (x, y, z)):
            continue
        positions.append(
            CoakNodePosition(item_id=item_id, x=float(x), y=float(y), z=float(z)),
        )
    return positions


def parse_expanded_folder_ids(raw: object) -> list[int]:
    if not isinstance(raw, list):
        return []
    expanded: list[int] = []
    for item in raw:
        if isinstance(item, bool) or not isinstance(item, int) or item < 1:
            continue
        expanded.append(item)
    return expanded


def parse_pinned_item_ids(raw: object) -> list[int]:
    if not isinstance(raw, list):
        return []
    pinned: list[int] = []
    seen: set[int] = set()
    for item in raw:
        if isinstance(item, bool) or not isinstance(item, int) or item < 1:
            continue
        if item in seen:
            continue
        seen.add(item)
        pinned.append(item)
    return pinned


def parse_camera(raw: object) -> CoakCameraState | None:
    if not isinstance(raw, dict):
        return None
    distance = raw.get("distance")
    polar_angle = raw.get("polar_angle")
    azimuth_angle = raw.get("azimuth_angle")
    if not all(isinstance(value, (int, float)) for value in (distance, polar_angle, azimuth_angle)):
        return None
    if float(distance) <= 0:
        return None
    return CoakCameraState(
        distance=float(distance),
        polar_angle=float(polar_angle),
        azimuth_angle=float(azimuth_angle),
    )


def workspace_state_from_record_data(raw: object) -> CoakWorkspaceStatePublic:
    if not isinstance(raw, dict):
        return empty_workspace_state()
    state_version = raw.get("state_version")
    if not isinstance(state_version, int):
        state_version = config.WORKSPACE_STATE_VERSION
    return CoakWorkspaceStatePublic(
        state_version=state_version,
        node_positions=parse_node_positions(raw.get("node_positions")),
        expanded_folder_ids=parse_expanded_folder_ids(raw.get("expanded_folder_ids")),
        pinned_item_ids=parse_pinned_item_ids(raw.get("pinned_item_ids")),
        camera=parse_camera(raw.get("camera")),
        persisted=True,
    )


async def get_workspace_state(user_id: int, record_id: int) -> CoakWorkspaceStatePublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        await assert_owned_record(conn, user_id=user_id, record_id=record_id)
        record_data = await records_repository.get_workspace_state(
            conn,
            user_id=user_id,
            record_id=record_id,
        )
    if record_data is None:
        return empty_workspace_state(persisted=False)
    return workspace_state_from_record_data(record_data)


async def update_workspace_state(
    user_id: int,
    record_id: int,
    payload: CoakWorkspaceStateUpdate,
) -> CoakWorkspaceStatePublic:
    if payload.state_version not in (1, config.WORKSPACE_STATE_VERSION):
        raise AppError(
            f"Unsupported workspace state version {payload.state_version}.",
            status_code=400,
        )

    state = CoakWorkspaceStatePublic(
        state_version=config.WORKSPACE_STATE_VERSION,
        node_positions=payload.node_positions,
        expanded_folder_ids=payload.expanded_folder_ids,
        pinned_item_ids=payload.pinned_item_ids,
        camera=payload.camera,
        persisted=True,
    )
    serialized = {
        "state_version": state.state_version,
        "node_positions": [
            {"item_id": pos.item_id, "x": pos.x, "y": pos.y, "z": pos.z}
            for pos in state.node_positions
        ],
        "expanded_folder_ids": list(state.expanded_folder_ids),
        "pinned_item_ids": list(state.pinned_item_ids),
        "camera": (
            {
                "distance": state.camera.distance,
                "polar_angle": state.camera.polar_angle,
                "azimuth_angle": state.camera.azimuth_angle,
            }
            if state.camera is not None
            else None
        ),
    }

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await assert_owned_record(conn, user_id=user_id, record_id=record_id)
            updated = await records_repository.update_workspace_state(
                conn,
                user_id=user_id,
                record_id=record_id,
                workspace_state=serialized,
            )
            if updated is None:
                raise AppError("Coak record not found.", status_code=404)

    return state
