# keel_api/src/modules/focus/service/constellation_state.py

"""Constellation canvas layout state persisted in user preferences."""

from __future__ import annotations

import re
from typing import Any

import asyncpg

from core.database import get_pool
from core.errors import AppError
from modules.focus import config
from modules.focus.schemas import (
    FocusConstellationNodePosition,
    FocusConstellationStatePublic,
    FocusConstellationStateUpdate,
    FocusConstellationViewport,
    FocusConstellationWorkOrderBadgeAngle,
)
from modules.focus.service.helpers import decode_preferences_data
from modules.settings import repository as settings_repository

_CONSTELLATION_POSITION_KEY_PATTERN = re.compile(r"^(list|entry|record):\d+$")
_CONSTELLATION_NODE_ID_PATTERN = re.compile(r"^(list|entry):\d+$")



def empty_constellation_state() -> FocusConstellationStatePublic:
    return FocusConstellationStatePublic(
        state_version=config.CONSTELLATION_STATE_VERSION,
        node_positions=[],
        work_order_badge_angles=[],
        expanded_ids=[],
        standalone_list_ids=[],
        viewport=None,
    )


def parse_constellation_viewport(raw: object) -> FocusConstellationViewport | None:
    if not isinstance(raw, dict):
        return None
    x = raw.get("x")
    y = raw.get("y")
    zoom = raw.get("zoom")
    if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
        return None
    if not isinstance(zoom, (int, float)) or zoom <= 0:
        return None
    return FocusConstellationViewport(x=float(x), y=float(y), zoom=float(zoom))


def parse_constellation_node_positions(raw: object) -> list[FocusConstellationNodePosition]:
    if not isinstance(raw, list):
        return []
    positions: list[FocusConstellationNodePosition] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        key = item.get("key")
        x = item.get("x")
        y = item.get("y")
        if not isinstance(key, str) or not _CONSTELLATION_POSITION_KEY_PATTERN.fullmatch(key):
            continue
        if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
            continue
        positions.append(FocusConstellationNodePosition(key=key, x=float(x), y=float(y)))
    return positions


def parse_constellation_work_order_badge_angles(
    raw: object,
) -> list[FocusConstellationWorkOrderBadgeAngle]:
    if not isinstance(raw, list):
        return []
    angles: list[FocusConstellationWorkOrderBadgeAngle] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        key = item.get("key")
        angle = item.get("angle")
        if not isinstance(key, str) or not _CONSTELLATION_POSITION_KEY_PATTERN.fullmatch(key):
            continue
        if not isinstance(angle, (int, float)):
            continue
        angles.append(
            FocusConstellationWorkOrderBadgeAngle(key=key, angle=float(angle)),
        )
    return angles


def parse_constellation_expanded_ids(raw: object) -> list[str]:
    if not isinstance(raw, list):
        return []
    expanded_ids: list[str] = []
    for item in raw:
        if not isinstance(item, str) or not _CONSTELLATION_NODE_ID_PATTERN.fullmatch(item):
            continue
        expanded_ids.append(item)
    return expanded_ids


def parse_constellation_standalone_list_ids(raw: object) -> list[int]:
    if not isinstance(raw, list):
        return []
    standalone_ids: list[int] = []
    for item in raw:
        if isinstance(item, bool) or not isinstance(item, int) or item < 1:
            continue
        standalone_ids.append(item)
    return standalone_ids


def constellation_state_from_preferences_data(
    data: dict[str, Any],
) -> FocusConstellationStatePublic:
    focus_data = data.get(config.PREFERENCES_FOCUS_KEY)
    if not isinstance(focus_data, dict):
        return empty_constellation_state()

    constellation_data = focus_data.get(config.PREFERENCES_CONSTELLATION_STATE_KEY)
    if not isinstance(constellation_data, dict):
        return empty_constellation_state()

    state_version = constellation_data.get("state_version")
    if not isinstance(state_version, int) or state_version < 1:
        state_version = config.CONSTELLATION_STATE_VERSION

    return FocusConstellationStatePublic(
        state_version=state_version,
        node_positions=parse_constellation_node_positions(
            constellation_data.get("node_positions"),
        ),
        work_order_badge_angles=parse_constellation_work_order_badge_angles(
            constellation_data.get("work_order_badge_angles"),
        ),
        expanded_ids=parse_constellation_expanded_ids(
            constellation_data.get("expanded_ids"),
        ),
        standalone_list_ids=parse_constellation_standalone_list_ids(
            constellation_data.get("standalone_list_ids"),
        ),
        viewport=parse_constellation_viewport(constellation_data.get("viewport")),
    )


def validate_constellation_state_payload(
    payload: FocusConstellationStateUpdate,
) -> FocusConstellationStatePublic:
    if payload.state_version != config.CONSTELLATION_STATE_VERSION:
        raise AppError(
            f"Unsupported constellation state version: {payload.state_version}.",
            status_code=400,
        )

    seen_position_keys: set[str] = set()
    for position in payload.node_positions:
        if not _CONSTELLATION_POSITION_KEY_PATTERN.fullmatch(position.key):
            raise AppError("Invalid constellation node position key.", status_code=400)
        if position.key in seen_position_keys:
            raise AppError("Duplicate constellation node position key.", status_code=400)
        seen_position_keys.add(position.key)

    seen_badge_angle_keys: set[str] = set()
    for badge_angle in payload.work_order_badge_angles:
        if not _CONSTELLATION_POSITION_KEY_PATTERN.fullmatch(badge_angle.key):
            raise AppError("Invalid constellation badge angle key.", status_code=400)
        if badge_angle.key in seen_badge_angle_keys:
            raise AppError("Duplicate constellation badge angle key.", status_code=400)
        seen_badge_angle_keys.add(badge_angle.key)

    seen_expanded_ids: set[str] = set()
    for node_id in payload.expanded_ids:
        if not _CONSTELLATION_NODE_ID_PATTERN.fullmatch(node_id):
            raise AppError("Invalid constellation expanded node id.", status_code=400)
        if node_id in seen_expanded_ids:
            raise AppError("Duplicate constellation expanded node id.", status_code=400)
        seen_expanded_ids.add(node_id)

    seen_standalone_ids: set[int] = set()
    for list_id in payload.standalone_list_ids:
        if list_id in seen_standalone_ids:
            raise AppError("Duplicate standalone list id.", status_code=400)
        seen_standalone_ids.add(list_id)

    return FocusConstellationStatePublic(
        state_version=payload.state_version,
        node_positions=list(payload.node_positions),
        work_order_badge_angles=list(payload.work_order_badge_angles),
        expanded_ids=list(payload.expanded_ids),
        standalone_list_ids=list(payload.standalone_list_ids),
        viewport=payload.viewport,
    )


async def read_constellation_state(
    conn: asyncpg.Connection,
    user_id: int,
) -> FocusConstellationStatePublic:
    row = await settings_repository.get_user_preferences(conn, user_id)
    data = decode_preferences_data(row["data"] if row is not None else None)
    return constellation_state_from_preferences_data(data)


async def write_constellation_state(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    state: FocusConstellationStatePublic,
) -> None:
    row = await settings_repository.get_user_preferences(conn, user_id)
    data = decode_preferences_data(row["data"] if row is not None else None)
    focus_data = dict(data.get("focus", {})) if isinstance(data.get("focus"), dict) else {}
    focus_data[config.PREFERENCES_CONSTELLATION_STATE_KEY] = {
        "state_version": state.state_version,
        "node_positions": [
            {"key": position.key, "x": position.x, "y": position.y}
            for position in state.node_positions
        ],
        "work_order_badge_angles": [
            {"key": badge_angle.key, "angle": badge_angle.angle}
            for badge_angle in state.work_order_badge_angles
        ],
        "expanded_ids": list(state.expanded_ids),
        "standalone_list_ids": list(state.standalone_list_ids),
        "viewport": (
            {
                "x": state.viewport.x,
                "y": state.viewport.y,
                "zoom": state.viewport.zoom,
            }
            if state.viewport is not None
            else None
        ),
    }
    data["focus"] = focus_data
    await settings_repository.upsert_user_preferences(conn, user_id=user_id, data=data)


async def promote_constellation_position_key(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    node_id: int,
) -> None:
    state = await read_constellation_state(conn, user_id)
    old_key = f"entry:{node_id}"
    new_key = f"list:{node_id}"
    old_position = next(
        (position for position in state.node_positions if position.key == old_key),
        None,
    )
    old_badge_angle = next(
        (
            badge_angle
            for badge_angle in state.work_order_badge_angles
            if badge_angle.key == old_key
        ),
        None,
    )
    if old_position is None and old_badge_angle is None:
        return

    next_positions = [
        position
        for position in state.node_positions
        if position.key not in {old_key, new_key}
    ]
    if old_position is not None:
        next_positions.append(
            FocusConstellationNodePosition(
                key=new_key,
                x=old_position.x,
                y=old_position.y,
            ),
        )
    next_badge_angles = [
        badge_angle
        for badge_angle in state.work_order_badge_angles
        if badge_angle.key not in {old_key, new_key}
    ]
    if old_badge_angle is not None:
        next_badge_angles.append(
            FocusConstellationWorkOrderBadgeAngle(
                key=new_key,
                angle=old_badge_angle.angle,
            ),
        )
    await write_constellation_state(
        conn,
        user_id=user_id,
        state=FocusConstellationStatePublic(
            state_version=state.state_version,
            node_positions=next_positions,
            work_order_badge_angles=next_badge_angles,
            expanded_ids=[entry for entry in state.expanded_ids if entry != old_key],
            standalone_list_ids=state.standalone_list_ids,
            viewport=state.viewport,
        ),
    )


async def get_constellation_state(user_id: int) -> FocusConstellationStatePublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        return await read_constellation_state(conn, user_id)


async def update_constellation_state(
    user_id: int,
    payload: FocusConstellationStateUpdate,
) -> FocusConstellationStatePublic:
    state = validate_constellation_state_payload(payload)
    pool = get_pool()
    async with pool.acquire() as conn:
        await write_constellation_state(conn, user_id=user_id, state=state)
    return state


async def merge_constellation_node_positions(
    user_id: int,
    updates: list[FocusConstellationNodePosition],
) -> FocusConstellationStatePublic:
    if not updates:
        return await get_constellation_state(user_id)

    state = await get_constellation_state(user_id)
    merged = {position.key: position for position in state.node_positions}
    for update in updates:
        merged[update.key] = update

    next_state = FocusConstellationStatePublic(
        state_version=state.state_version,
        node_positions=list(merged.values()),
        work_order_badge_angles=list(state.work_order_badge_angles),
        expanded_ids=list(state.expanded_ids),
        standalone_list_ids=list(state.standalone_list_ids),
        viewport=state.viewport,
    )
    pool = get_pool()
    async with pool.acquire() as conn:
        await write_constellation_state(conn, user_id=user_id, state=next_state)
    return next_state
