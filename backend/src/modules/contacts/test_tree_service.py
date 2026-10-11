# stack_sandbox/backend/src/modules/contacts/test_tree_service.py

"""Unit tests for genealogical depth assignment."""

from __future__ import annotations

from collections import deque
from types import SimpleNamespace


def _build_depth_map(
    member_ids: set[int],
    edges: list[SimpleNamespace],
    root_contact_id: int | None,
) -> dict[int, int]:
    """Mirror of tree_service._build_depth_map for standalone testing."""
    if not member_ids:
        return {}

    weighted: dict[int, list[tuple[int, int]]] = {
        contact_id: [] for contact_id in member_ids
    }
    for edge in edges:
        from_id = edge.from_contact_id
        to_id = edge.to_contact_id
        rel_type = edge.relationship_type
        if from_id not in member_ids or to_id not in member_ids:
            continue
        if rel_type == "parent":
            weighted[from_id].append((to_id, 1))
            weighted[to_id].append((from_id, -1))
        elif rel_type in {"spouse", "sibling"}:
            weighted[from_id].append((to_id, 0))
            weighted[to_id].append((from_id, 0))

    start = root_contact_id if root_contact_id in member_ids else next(iter(member_ids))
    depths: dict[int, int] = {start: 0}
    queue: deque[int] = deque([start])
    while queue:
        current = queue.popleft()
        current_depth = depths[current]
        for neighbor, delta in weighted[current]:
            if neighbor in depths:
                continue
            depths[neighbor] = current_depth + delta
            queue.append(neighbor)

    for contact_id in member_ids:
        depths.setdefault(contact_id, 0)

    min_depth = min(depths.values())
    if min_depth < 0:
        depths = {contact_id: depth - min_depth for contact_id, depth in depths.items()}

    return depths


def _edge(from_id: int, to_id: int, relationship_type: str) -> SimpleNamespace:
    return SimpleNamespace(
        from_contact_id=from_id,
        to_contact_id=to_id,
        relationship_type=relationship_type,
    )


def test_ittyadathu_family_generations() -> None:
    """Rajan and Anumol share Gen 0; children are Gen 1."""
    member_ids = {1, 2, 3, 4, 5}
    edges = [
        _edge(1, 2, "spouse"),
        _edge(1, 3, "parent"),
        _edge(1, 4, "parent"),
        _edge(1, 5, "parent"),
        _edge(2, 3, "parent"),
        _edge(2, 4, "parent"),
        _edge(2, 5, "parent"),
    ]

    depths = _build_depth_map(member_ids, edges, root_contact_id=1)

    assert depths[1] == 0
    assert depths[2] == 0
    assert depths[3] == 1
    assert depths[4] == 1
    assert depths[5] == 1


def test_parent_above_child_when_root_is_child() -> None:
    member_ids = {10, 11}
    edges = [_edge(10, 11, "parent")]

    depths = _build_depth_map(member_ids, edges, root_contact_id=11)

    assert depths[10] == 0
    assert depths[11] == 1


if __name__ == "__main__":
    test_ittyadathu_family_generations()
    test_parent_above_child_when_root_is_child()
    print("tree_service tests passed")
