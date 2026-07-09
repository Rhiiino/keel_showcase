# keel_api/src/modules/focus/service/constellation_layout.py

"""Constellation layout snapshots and semantic placement for connector tools."""

from __future__ import annotations

import math
from typing import Any

from core.errors import AppError
from modules.focus.schemas import FocusConstellationNodePosition, FocusNodePublic
from modules.focus.service.constellation_state import (
    get_constellation_state,
    merge_constellation_node_positions,
)
from modules.focus.service.nodes import get_focus_node, list_focus_nodes

EXPANDED_CHILD_RADIUS = 196.0
NESTED_EXPANDED_RADIUS = 168.0



# ----- Position keys
def position_key_for_focus_node(node: FocusNodePublic) -> str:
    if node.kind == "list":
        return f"list:{node.id}"
    if node.kind == "record":
        return f"record:{node.id}"
    return f"entry:{node.id}"


def canvas_expanded_id_for_focus_node(node: FocusNodePublic) -> str:
    if node.kind == "list":
        return f"list:{node.id}"
    return f"entry:{node.id}"


def _positions_by_key(
    state_positions: list[FocusConstellationNodePosition],
) -> dict[str, tuple[float, float]]:
    return {position.key: (position.x, position.y) for position in state_positions}


def _child_radius(parent: FocusNodePublic) -> float:
    return EXPANDED_CHILD_RADIUS if parent.parent_id is None else NESTED_EXPANDED_RADIUS


def _angle_between(
    start_x: float,
    start_y: float,
    end_x: float,
    end_y: float,
) -> float:
    return math.atan2(end_y - start_y, end_x - start_x)


def _position_from_polar(
    center_x: float,
    center_y: float,
    angle_rad: float,
    radius: float,
) -> tuple[float, float]:
    return (
        center_x + math.cos(angle_rad) * radius,
        center_y + math.sin(angle_rad) * radius,
    )


def _resolve_node_position(
    node: FocusNodePublic,
    positions_by_key: dict[str, tuple[float, float]],
) -> tuple[float, float] | None:
    return positions_by_key.get(position_key_for_focus_node(node))


def _build_children_by_parent(
    nodes: list[FocusNodePublic],
) -> dict[int, list[FocusNodePublic]]:
    children_by_parent: dict[int, list[FocusNodePublic]] = {}
    for node in nodes:
        if node.parent_id is None:
            continue
        children_by_parent.setdefault(node.parent_id, []).append(node)
    for children in children_by_parent.values():
        children.sort(key=lambda child: child.sort_order)
    return children_by_parent



# ----- Layout snapshot
async def build_constellation_layout_snapshot(user_id: int) -> dict[str, Any]:
    nodes = await list_focus_nodes(user_id)
    state = await get_constellation_state(user_id)
    positions_by_key = _positions_by_key(state.node_positions)
    expanded_ids = set(state.expanded_ids)
    children_by_parent = _build_children_by_parent(nodes)

    origin = next((node for node in nodes if node.is_origin), None)
    standalone_roots = [
        node
        for node in nodes
        if node.kind == "list" and not node.is_origin and node.parent_id is None
    ]

    visible_nodes: list[dict[str, Any]] = []
    visible_edges: list[dict[str, int]] = []
    visited: set[int] = set()
    queue: list[FocusNodePublic] = []

    if origin is not None:
        queue.append(origin)
    queue.extend(standalone_roots)

    while queue:
        parent = queue.pop(0)
        if parent.id in visited:
            continue
        visited.add(parent.id)

        position = _resolve_node_position(parent, positions_by_key)
        visible_nodes.append(
            {
                "node_id": parent.id,
                "title": parent.title,
                "parent_id": parent.parent_id,
                "kind": parent.kind,
                "position_key": position_key_for_focus_node(parent),
                "x": position[0] if position is not None else None,
                "y": position[1] if position is not None else None,
            },
        )

        if canvas_expanded_id_for_focus_node(parent) not in expanded_ids:
            continue

        for child in children_by_parent.get(parent.id, []):
            visible_edges.append({"source_id": parent.id, "target_id": child.id})
            if child.id not in visited:
                queue.append(child)

    return {
        "nodes": visible_nodes,
        "edges": visible_edges,
        "expanded_ids": list(state.expanded_ids),
    }



# ----- Semantic placement
def compute_semantic_node_position(
    *,
    node: FocusNodePublic,
    parent: FocusNodePublic,
    grandparent: FocusNodePublic | None,
    parent_position: tuple[float, float],
    grandparent_position: tuple[float, float] | None,
    placement: dict[str, Any],
) -> tuple[float, float]:
    radius = _child_radius(parent)
    distance = placement.get("distance")
    if distance not in (None, "default"):
        if not isinstance(distance, (int, float)) or distance <= 0:
            raise AppError("placement.distance must be 'default' or a positive number.", status_code=400)
        radius = float(distance)

    mode = placement.get("mode")
    if mode == "relative_to_parent":
        angle_degrees = placement.get("angle_degrees")
        if not isinstance(angle_degrees, (int, float)):
            raise AppError("placement.angle_degrees is required for relative_to_parent.", status_code=400)
        angle_rad = math.radians(float(angle_degrees))
        return _position_from_polar(parent_position[0], parent_position[1], angle_rad, radius)

    if mode == "away_from_grandparent":
        if grandparent_position is not None and grandparent is not None:
            angle_rad = _angle_between(
                grandparent_position[0],
                grandparent_position[1],
                parent_position[0],
                parent_position[1],
            )
        else:
            angle_rad = _angle_between(0.0, 0.0, parent_position[0], parent_position[1])
        return _position_from_polar(parent_position[0], parent_position[1], angle_rad, radius)

    raise AppError(
        "placement.mode must be 'relative_to_parent' or 'away_from_grandparent'.",
        status_code=400,
    )


async def place_focus_constellation_node(
    user_id: int,
    *,
    node_id: int,
    placement: dict[str, Any],
) -> dict[str, Any]:
    node = await get_focus_node(user_id, node_id, include_subtree=False)
    if node.parent_id is None:
        raise AppError("Only child nodes can be placed on the constellation canvas.", status_code=400)

    parent = await get_focus_node(user_id, node.parent_id, include_subtree=False)
    state = await get_constellation_state(user_id)
    positions_by_key = _positions_by_key(state.node_positions)

    parent_position = _resolve_node_position(parent, positions_by_key)
    if parent_position is None:
        raise AppError(
            "Parent node does not have a stored constellation position yet.",
            status_code=400,
        )

    grandparent: FocusNodePublic | None = None
    grandparent_position: tuple[float, float] | None = None
    if parent.parent_id is not None:
        grandparent = await get_focus_node(user_id, parent.parent_id, include_subtree=False)
        grandparent_position = _resolve_node_position(grandparent, positions_by_key)

    target = compute_semantic_node_position(
        node=node,
        parent=parent,
        grandparent=grandparent,
        parent_position=parent_position,
        grandparent_position=grandparent_position,
        placement=placement,
    )
    position_key = position_key_for_focus_node(node)
    updated = await merge_constellation_node_positions(
        user_id,
        [FocusConstellationNodePosition(key=position_key, x=target[0], y=target[1])],
    )

    return {
        "node_id": node_id,
        "position_key": position_key,
        "x": target[0],
        "y": target[1],
        "state_version": updated.state_version,
    }
