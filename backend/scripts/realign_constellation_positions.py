#!/usr/bin/env python3
"""Realign focus constellation node positions in user preferences.

Lays out each parent and its children as a local cluster with generous spacing,
then separates top-level clusters so subtrees do not collapse into one ball.

Usage (from keel_api, with DATABASE_URL set):
  python scripts/realign_constellation_positions.py [user_id] [--dry-run]
"""

from __future__ import annotations

import asyncio
import json
import math
import os
import sys
from dataclasses import dataclass
from typing import Any

import asyncpg

# Spacing tuned above the in-app minimums so clusters have visible breathing room.
MIN_NODE_DISTANCE = 180.0
ORIGIN_CLEARANCE = 240.0
NODE_RADIUS = 44.0

# Parent → direct children ring distance (px), by depth from origin/standalone root.
ROOT_CHILD_RADIUS = 520.0
DEPTH1_CHILD_RADIUS = 400.0
NESTED_CHILD_RADIUS = 300.0
NESTED_CHILD_RADIUS_STEP = 36.0

# Standalone list islands orbit far from the origin tree.
STANDALONE_ORBIT_RADIUS = 1800.0

# Minimum gap between separate top-level cluster bounding circles.
CLUSTER_GAP = 320.0


@dataclass
class FocusNodeRow:
    id: int
    parent_id: int | None
    kind: str
    sort_order: int
    work_order: int | None
    is_origin: bool

    @property
    def position_key(self) -> str:
        if self.kind == "list":
            return f"list:{self.id}"
        if self.kind == "record":
            return f"record:{self.id}"
        return f"entry:{self.id}"

    @property
    def is_container(self) -> bool:
        return self.kind in {"list", "record"}


@dataclass
class ClusterBounds:
    root_key: str
    node_keys: set[str]
    cx: float
    cy: float
    radius: float


def ring_position(
    center_x: float,
    center_y: float,
    index: int,
    total: int,
    radius: float,
) -> tuple[float, float]:
    if total <= 0:
        return center_x, center_y
    angle = (2 * math.pi * index) / total - math.pi / 2
    return (
        center_x + radius * math.cos(angle),
        center_y + radius * math.sin(angle),
    )


def build_children_by_parent(
    nodes: list[FocusNodeRow],
) -> dict[int, list[FocusNodeRow]]:
    children_by_parent: dict[int, list[FocusNodeRow]] = {}
    for node in nodes:
        if node.parent_id is None:
            continue
        children_by_parent.setdefault(node.parent_id, []).append(node)
    for children in children_by_parent.values():
        children.sort(
            key=lambda child: (
                child.work_order if child.work_order is not None else 0,
                child.sort_order,
                child.id,
            ),
        )
    return children_by_parent


def subtree_size(node_id: int, children_by_parent: dict[int, list[FocusNodeRow]]) -> int:
    children = children_by_parent.get(node_id, [])
    if not children:
        return 1
    return 1 + sum(subtree_size(child.id, children_by_parent) for child in children)


def parent_child_radius(
    depth: int,
    child_count: int,
    children: list[FocusNodeRow],
    children_by_parent: dict[int, list[FocusNodeRow]],
) -> float:
    if depth == 0:
        base = ROOT_CHILD_RADIUS
    elif depth == 1:
        base = DEPTH1_CHILD_RADIUS
    else:
        base = NESTED_CHILD_RADIUS + (depth - 2) * NESTED_CHILD_RADIUS_STEP

    if child_count > 1:
        ring_min = MIN_NODE_DISTANCE / (2 * math.sin(math.pi / child_count))
        base = max(base, ring_min)

    if children:
        largest_subtree = max(subtree_size(child.id, children_by_parent) for child in children)
        base = max(base, 220.0 + math.sqrt(largest_subtree) * 90.0)

    return base


def layout_subtree(
    node: FocusNodeRow,
    center_x: float,
    center_y: float,
    depth: int,
    children_by_parent: dict[int, list[FocusNodeRow]],
) -> dict[str, tuple[float, float]]:
    positions: dict[str, tuple[float, float]] = {
        node.position_key: (center_x, center_y),
    }
    children = children_by_parent.get(node.id, [])
    if not children:
        return positions

    radius = parent_child_radius(depth, len(children), children, children_by_parent)
    for index, child in enumerate(children):
        child_x, child_y = ring_position(center_x, center_y, index, len(children), radius)
        positions.update(
            layout_subtree(child, child_x, child_y, depth + 1, children_by_parent),
        )
    return positions


def ensure_origin_branch_clearance(
    positions: dict[str, tuple[float, float]],
    origin_key: str,
    branch_roots: list[FocusNodeRow],
    children_by_parent: dict[int, list[FocusNodeRow]],
    min_radius: float,
) -> None:
    origin_x, origin_y = positions[origin_key]

    def collect_subtree_keys(node: FocusNodeRow) -> set[str]:
        keys = {node.position_key}
        for child in children_by_parent.get(node.id, []):
            keys.update(collect_subtree_keys(child))
        return keys

    for root in branch_roots:
        keys = collect_subtree_keys(root)
        keys = {key for key in keys if key in positions}
        if not keys:
            continue
        root_x, root_y = positions[root.position_key]
        dx = root_x - origin_x
        dy = root_y - origin_y
        distance = math.hypot(dx, dy)
        if distance >= min_radius or distance < 0.001:
            continue
        scale = min_radius / distance
        shift_x = origin_x + dx * scale - root_x
        shift_y = origin_y + dy * scale - root_y
        for key in keys:
            x, y = positions[key]
            positions[key] = (x + shift_x, y + shift_y)


def compute_layout(nodes: list[FocusNodeRow]) -> dict[str, tuple[float, float]]:
    children_by_parent = build_children_by_parent(nodes)
    origin = next((node for node in nodes if node.is_origin), None)
    standalone_roots = [
        node
        for node in nodes
        if node.parent_id is None and not node.is_origin and node.kind == "list"
    ]

    positions: dict[str, tuple[float, float]] = {}
    cluster_roots: list[FocusNodeRow] = []

    if origin is not None:
        positions[origin.position_key] = (0.0, 0.0)
        origin_children = children_by_parent.get(origin.id, [])
        major_radius = ROOT_CHILD_RADIUS * 1.35
        for index, child in enumerate(origin_children):
            root_x, root_y = ring_position(0.0, 0.0, index, len(origin_children), major_radius)
            positions.update(layout_subtree(child, root_x, root_y, 1, children_by_parent))
            cluster_roots.append(child)

    for index, root in enumerate(standalone_roots):
        sx, sy = ring_position(
            0.0,
            0.0,
            index,
            len(standalone_roots),
            STANDALONE_ORBIT_RADIUS,
        )
        positions.update(layout_subtree(root, sx, sy, 0, children_by_parent))
        cluster_roots.append(root)

    origin_key = origin.position_key if origin is not None else None
    origin_children = children_by_parent.get(origin.id, []) if origin is not None else []
    major_radius = ROOT_CHILD_RADIUS * 1.35

    membership = build_cluster_membership(cluster_roots, positions, children_by_parent)
    cluster_list = [
        cluster_bounds_from_membership(root, keys, positions)
        for root, keys in membership
        if keys
    ]
    separate_clusters(positions, cluster_list, max_passes=200)

    if origin_key is not None and origin_children:
        ensure_origin_branch_clearance(
            positions,
            origin_key,
            origin_children,
            children_by_parent,
            major_radius * 0.92,
        )
        cluster_list = [
            cluster_bounds_from_membership(root, keys, positions)
            for root, keys in membership
            if keys
        ]
        separate_clusters(positions, cluster_list, max_passes=80)

    # Touch up overlaps inside each cluster only — never pull separate clusters together.
    for _root, keys in membership:
        if len(keys) < 2:
            continue
        local = {key: positions[key] for key in keys}
        enforce_local_min_distances(local, origin_key if origin_key in keys else None, max_passes=40)
        positions.update(local)

    return positions


def build_cluster_membership(
    roots: list[FocusNodeRow],
    positions: dict[str, tuple[float, float]],
    children_by_parent: dict[int, list[FocusNodeRow]],
) -> list[tuple[FocusNodeRow, set[str]]]:
    membership: list[tuple[FocusNodeRow, set[str]]] = []

    def collect_subtree_keys(node: FocusNodeRow) -> set[str]:
        keys = {node.position_key}
        for child in children_by_parent.get(node.id, []):
            keys.update(collect_subtree_keys(child))
        return keys

    for root in roots:
        keys = collect_subtree_keys(root)
        keys = {key for key in keys if key in positions}
        membership.append((root, keys))
    return membership


def cluster_bounds_from_membership(
    root: FocusNodeRow,
    node_keys: set[str],
    positions: dict[str, tuple[float, float]],
) -> ClusterBounds:
    xs = [positions[key][0] for key in node_keys]
    ys = [positions[key][1] for key in node_keys]
    cx = sum(xs) / len(xs)
    cy = sum(ys) / len(ys)
    radius = max(
        math.hypot(positions[key][0] - cx, positions[key][1] - cy) + NODE_RADIUS
        for key in node_keys
    )
    return ClusterBounds(
        root_key=root.position_key,
        node_keys=node_keys,
        cx=cx,
        cy=cy,
        radius=radius,
    )


def separate_clusters(
    positions: dict[str, tuple[float, float]],
    clusters: list[ClusterBounds],
    max_passes: int = 120,
) -> None:
    if len(clusters) <= 1:
        return

    for _ in range(max_passes):
        moved = False
        for index_a in range(len(clusters)):
            for index_b in range(index_a + 1, len(clusters)):
                cluster_a = clusters[index_a]
                cluster_b = clusters[index_b]
                dx = cluster_b.cx - cluster_a.cx
                dy = cluster_b.cy - cluster_a.cy
                distance = math.hypot(dx, dy)
                required = cluster_a.radius + cluster_b.radius + CLUSTER_GAP
                if distance >= required:
                    continue
                if distance < 0.001:
                    angle = ((index_a + index_b + 1) * math.pi) / 5
                    dx = math.cos(angle)
                    dy = math.sin(angle)
                    distance = 1.0
                push = (required - distance) / 2
                ux = dx / distance
                uy = dy / distance

                shift_ax = -ux * push
                shift_ay = -uy * push
                shift_bx = ux * push
                shift_by = uy * push

                for key in cluster_a.node_keys:
                    x, y = positions[key]
                    positions[key] = (x + shift_ax, y + shift_ay)
                cluster_a.cx += shift_ax
                cluster_a.cy += shift_ay

                for key in cluster_b.node_keys:
                    x, y = positions[key]
                    positions[key] = (x + shift_bx, y + shift_by)
                cluster_b.cx += shift_bx
                cluster_b.cy += shift_by
                moved = True
        if not moved:
            break


def enforce_local_min_distances(
    positions: dict[str, tuple[float, float]],
    origin_key: str | None,
    max_passes: int = 80,
) -> None:
    keys = list(positions.keys())
    for _ in range(max_passes):
        moved = False
        for index_a, key_a in enumerate(keys):
            ax, ay = positions[key_a]
            for index_b in range(index_a + 1, len(keys)):
                key_b = keys[index_b]
                bx, by = positions[key_b]
                dx = bx - ax
                dy = by - ay
                distance = math.hypot(dx, dy)
                is_origin_pair = origin_key is not None and origin_key in {key_a, key_b}
                min_distance = ORIGIN_CLEARANCE if is_origin_pair else MIN_NODE_DISTANCE
                if distance >= min_distance:
                    continue
                if distance < 0.001:
                    angle = ((index_a + index_b + 1) * math.pi) / 4
                    dx = math.cos(angle)
                    dy = math.sin(angle)
                    distance = 1.0
                push = min_distance - distance
                ux = dx / distance
                uy = dy / distance
                if origin_key == key_a:
                    positions[key_b] = (bx + ux * push, by + uy * push)
                elif origin_key == key_b:
                    positions[key_a] = (ax - ux * push, ay - uy * push)
                else:
                    positions[key_a] = (ax - ux * (push / 2), ay - uy * (push / 2))
                    positions[key_b] = (bx + ux * (push / 2), by + uy * (push / 2))
                moved = True
        if origin_key is not None:
            positions[origin_key] = (0.0, 0.0)
        if not moved:
            break


def load_database_url() -> str:
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        return database_url

    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.isfile(env_path):
        with open(env_path, encoding="utf-8") as env_file:
            for line in env_file:
                line = line.strip()
                if line.startswith("DATABASE_URL="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("DATABASE_URL is not set and .env was not found.")


async def realign_user_constellation(user_id: int, *, dry_run: bool) -> None:
    database_url = load_database_url()
    conn = await asyncpg.connect(database_url)
    try:
        rows = await conn.fetch(
            """
            SELECT id, parent_id, kind, sort_order, work_order, is_origin
            FROM focus_nodes
            WHERE user_id = $1
            ORDER BY sort_order, id
            """,
            user_id,
        )
        if not rows:
            print(f"No focus nodes found for user {user_id}.")
            return

        focus_nodes = [
            FocusNodeRow(
                id=row["id"],
                parent_id=row["parent_id"],
                kind=row["kind"],
                sort_order=row["sort_order"],
                work_order=row["work_order"],
                is_origin=row["is_origin"],
            )
            for row in rows
        ]

        pref_row = await conn.fetchrow(
            "SELECT data FROM user_preferences WHERE user_id = $1",
            user_id,
        )
        if pref_row is None:
            raise RuntimeError(f"No user_preferences row for user {user_id}.")

        raw_data = pref_row["data"]
        if isinstance(raw_data, str):
            data = json.loads(raw_data)
        elif isinstance(raw_data, dict):
            data = dict(raw_data)
        else:
            data = {}
        focus_data = dict(data.get("focus", {})) if isinstance(data.get("focus"), dict) else {}
        constellation = dict(focus_data.get("constellation", {})) if isinstance(
            focus_data.get("constellation"),
            dict,
        ) else {}

        next_positions = compute_layout(focus_nodes)
        constellation["node_positions"] = [
            {"key": key, "x": x, "y": y}
            for key, (x, y) in sorted(next_positions.items(), key=lambda item: item[0])
        ]
        if "state_version" not in constellation:
            constellation["state_version"] = 6

        focus_data["constellation"] = constellation
        data["focus"] = focus_data

        xs = [point[0] for point in next_positions.values()]
        ys = [point[1] for point in next_positions.values()]
        spread = math.hypot(max(xs) - min(xs), max(ys) - min(ys))
        print(
            f"User {user_id}: realigned {len(next_positions)} constellation node positions "
            f"(from {len(focus_nodes)} focus nodes, spread ~{spread:.0f}px)."
        )

        if dry_run:
            sample = constellation["node_positions"][:5]
            print("Dry run — sample positions:", json.dumps(sample, indent=2))
            return

        await conn.execute(
            """
            UPDATE user_preferences
            SET data = $2::jsonb, updated_at = NOW()
            WHERE user_id = $1
            """,
            user_id,
            json.dumps(data),
        )
        print("Saved updated constellation positions to user_preferences.")
    finally:
        await conn.close()


def main() -> None:
    args = [arg for arg in sys.argv[1:] if arg != "--dry-run"]
    dry_run = "--dry-run" in sys.argv
    user_id = int(args[0]) if args else 1
    asyncio.run(realign_user_constellation(user_id, dry_run=dry_run))


if __name__ == "__main__":
    main()
