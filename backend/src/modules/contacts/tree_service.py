# stack_sandbox/backend/src/modules/contacts/tree_service.py

"""Read-only family tree assembly for computed nuclear-family subgraphs."""

from __future__ import annotations

from collections import deque

import asyncpg

from modules.contacts import relationships_repository
from modules.contacts.families_service import NuclearFamily
from modules.contacts.schemas import (
    ContactPublic,
    FamilyTreeEdgePublic,
    FamilyTreeNodePublic,
    FamilyTreePublic,
)



def _find_connected_components(
    contact_ids: list[int],
    edges: list[asyncpg.Record],
) -> list[list[int]]:
    parent: dict[int, int] = {contact_id: contact_id for contact_id in contact_ids}

    def find(contact_id: int) -> int:
        current_parent = parent[contact_id]
        if current_parent != contact_id:
            parent[contact_id] = find(current_parent)
        return parent[contact_id]

    def union(left_id: int, right_id: int) -> None:
        left_root = find(left_id)
        right_root = find(right_id)
        if left_root != right_root:
            parent[right_root] = left_root

    for edge in edges:
        union(edge["from_contact_id"], edge["to_contact_id"])

    buckets: dict[int, list[int]] = {}
    for contact_id in contact_ids:
        root = find(contact_id)
        buckets.setdefault(root, []).append(contact_id)

    return [sorted(ids) for ids in buckets.values()]


def _build_depth_map(
    member_ids: set[int],
    edges: list[asyncpg.Record],
    root_contact_id: int | None,
) -> dict[int, int]:
    """Assign generation depth via weighted traversal from the group root."""
    if not member_ids:
        return {}

    weighted: dict[int, list[tuple[int, int]]] = {
        contact_id: [] for contact_id in member_ids
    }
    for edge in edges:
        from_id = edge["from_contact_id"]
        to_id = edge["to_contact_id"]
        rel_type = edge["relationship_type"]
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


def _find_root_contact(
    member_ids: set[int],
    edges: list[asyncpg.Record],
    preferred_roots: list[int | None] | None = None,
) -> int | None:
    if preferred_roots:
        for root_id in preferred_roots:
            if root_id is not None and root_id in member_ids:
                return root_id

    children = {
        edge["to_contact_id"]
        for edge in edges
        if edge["relationship_type"] == "parent" and edge["to_contact_id"] in member_ids
    }
    roots = [contact_id for contact_id in member_ids if contact_id not in children]
    if roots:
        return min(roots)
    return min(member_ids) if member_ids else None


def _edges_for_members(
    member_ids: set[int],
    edge_rows: list[asyncpg.Record],
) -> list[asyncpg.Record]:
    return [
        edge
        for edge in edge_rows
        if edge["from_contact_id"] in member_ids and edge["to_contact_id"] in member_ids
    ]


def _assemble_family_tree(
    *,
    group_id: str,
    member_ids: list[int],
    root_contact_id: int | None,
    edge_rows: list[asyncpg.Record],
    contacts_by_id: dict[int, ContactPublic],
) -> FamilyTreePublic:
    member_set = set(member_ids)
    component_edges = _edges_for_members(member_set, edge_rows)
    depths = _build_depth_map(member_set, component_edges, root_contact_id)

    nodes = [
        FamilyTreeNodePublic(
            contact=contacts_by_id[contact_id],
            depth=depths.get(contact_id, 0),
        )
        for contact_id in member_ids
        if contact_id in contacts_by_id
    ]
    nodes.sort(
        key=lambda node: (node.depth, node.contact.last_name or "", node.contact.first_name or "")
    )

    edges = [
        FamilyTreeEdgePublic(
            id=row["id"],
            from_contact_id=row["from_contact_id"],
            to_contact_id=row["to_contact_id"],
            relationship_type=row["relationship_type"],
        )
        for row in component_edges
    ]

    return FamilyTreePublic(
        group_id=group_id,
        root_contact_id=root_contact_id,
        nodes=nodes,
        edges=edges,
    )


async def _add_spouse_contacts_for_members(
    conn: asyncpg.Connection,
    user_id: int,
    member_ids: set[int],
) -> set[int]:
    """Include spouses of selected members when they are outside the nuclear unit."""
    expanded = set(member_ids)
    touching_rows = await relationships_repository.list_genealogical_relationships_touching(
        conn,
        user_id,
        list(member_ids),
    )
    for row in touching_rows:
        if row["relationship_type"] != "spouse":
            continue
        expanded.add(row["from_contact_id"])
        expanded.add(row["to_contact_id"])
    return expanded



async def build_family_tree(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    family_key: str,
    member_ids: list[int],
    root_contact_id: int | None,
    contacts_by_id: dict[int, ContactPublic],
) -> FamilyTreePublic:
    """Build nodes and edges for one computed family's induced subgraph."""
    edge_rows = await relationships_repository.list_relationships_for_group(
        conn,
        user_id,
        member_ids,
    )
    return _assemble_family_tree(
        group_id=family_key,
        member_ids=member_ids,
        root_contact_id=root_contact_id,
        edge_rows=edge_rows,
        contacts_by_id=contacts_by_id,
    )


async def build_merged_family_trees(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    selected_families: list[NuclearFamily],
    contacts_by_id: dict[int, ContactPublic],
) -> list[FamilyTreePublic]:
    """Build connected trees for multiple selected families with bridging edges."""
    if not selected_families:
        return []

    if len(selected_families) == 1:
        family = selected_families[0]
        tree = await build_family_tree(
            conn,
            user_id=user_id,
            family_key=family.family_key,
            member_ids=family.member_contact_ids,
            root_contact_id=family.root_contact_id,
            contacts_by_id=contacts_by_id,
        )
        return [tree]

    seed_ids: set[int] = set()
    preferred_roots: list[int | None] = []
    for family in selected_families:
        seed_ids.update(family.member_contact_ids)
        preferred_roots.append(family.root_contact_id)

    member_ids = await _add_spouse_contacts_for_members(conn, user_id, seed_ids)
    edge_rows = await relationships_repository.list_relationships_for_group(
        conn,
        user_id,
        sorted(member_ids),
    )
    components = _find_connected_components(sorted(member_ids), edge_rows)

    trees: list[FamilyTreePublic] = []
    for index, component_ids in enumerate(components):
        component_set = set(component_ids)
        root_contact_id = _find_root_contact(
            component_set,
            _edges_for_members(component_set, edge_rows),
            preferred_roots,
        )
        trees.append(
            _assemble_family_tree(
                group_id=f"merged-{index + 1}",
                member_ids=component_ids,
                root_contact_id=root_contact_id,
                edge_rows=edge_rows,
                contacts_by_id=contacts_by_id,
            )
        )
    return trees
