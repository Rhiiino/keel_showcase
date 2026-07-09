# stack_sandbox/backend/src/modules/contacts/families_service.py

"""Discover nuclear-family units from contact relationships."""

from __future__ import annotations

from dataclasses import dataclass

import asyncpg


@dataclass(frozen=True)
class NuclearFamily:
    """One immediate family: parents and their shared children."""

    family_key: str
    name: str
    father_contact_id: int | None
    mother_contact_id: int | None
    root_contact_id: int | None
    member_contact_ids: list[int]


@dataclass(frozen=True)
class _ContactInfo:
    id: int
    first_name: str | None
    gender: str | None


def make_family_key(father_id: int | None, mother_id: int | None) -> str:
    """Stable route identifier for a nuclear family unit."""
    return f"{father_id or 0}-{mother_id or 0}"


def possessive_first_name(first_name: str) -> str:
    """Rajan -> Rajan's; James -> James's (aligned with FamilyTreeView)."""
    trimmed = first_name.strip()
    if trimmed.endswith("s"):
        return f"{trimmed}'"
    return f"{trimmed}'s"


def family_display_name(
    naming_contact: _ContactInfo,
    family_key: str,
) -> str:
    """Build '{FirstName}'s family' from the naming parent."""
    first_name = (naming_contact.first_name or "").strip()
    if not first_name:
        return f"Family {family_key}"
    return f"{possessive_first_name(first_name)} family"


def _spouse_pairs(spouse_edges: list[tuple[int, int]]) -> list[tuple[int, int]]:
    seen: set[tuple[int, int]] = set()
    pairs: list[tuple[int, int]] = []
    for left_id, right_id in spouse_edges:
        pair = (min(left_id, right_id), max(left_id, right_id))
        if pair in seen:
            continue
        seen.add(pair)
        pairs.append(pair)
    return pairs


def _pick_father_and_mother(
    left: _ContactInfo,
    right: _ContactInfo,
) -> tuple[_ContactInfo, _ContactInfo, _ContactInfo]:
    """Return (father, mother, naming_contact) for a spouse pair."""
    if left.gender == "male" and right.gender != "male":
        return left, right, left
    if right.gender == "male" and left.gender != "male":
        return right, left, right
    if left.gender == "female" and right.gender != "female":
        return right, left, right
    if right.gender == "female" and left.gender != "female":
        return left, right, left
    if left.id <= right.id:
        return left, right, left
    return right, left, right


def _shared_children(
    parent_a_id: int,
    parent_b_id: int,
    children_by_parent: dict[int, set[int]],
) -> list[int]:
    children_a = children_by_parent.get(parent_a_id, set())
    children_b = children_by_parent.get(parent_b_id, set())
    return sorted(children_a & children_b)


def discover_nuclear_families(
    contacts: list[_ContactInfo],
    parent_edges: list[tuple[int, int]],
    spouse_edges: list[tuple[int, int]],
) -> list[NuclearFamily]:
    """Build virtual nuclear families from spouse and parent relationships."""
    contacts_by_id = {contact.id: contact for contact in contacts}
    children_by_parent: dict[int, set[int]] = {}
    for parent_id, child_id in parent_edges:
        children_by_parent.setdefault(parent_id, set()).add(child_id)

    families: list[NuclearFamily] = []
    couple_child_ids: set[int] = set()

    for left_id, right_id in _spouse_pairs(spouse_edges):
        left = contacts_by_id.get(left_id)
        right = contacts_by_id.get(right_id)
        if left is None or right is None:
            continue

        father, mother, naming_contact = _pick_father_and_mother(left, right)
        shared_children = _shared_children(father.id, mother.id, children_by_parent)
        couple_child_ids.update(shared_children)

        if father.gender == "male":
            father_id: int | None = father.id
            mother_id: int | None = mother.id
            root_contact_id = father.id
        else:
            father_id = None
            mother_id = mother.id
            root_contact_id = naming_contact.id

        family_key = make_family_key(father_id, mother_id)
        member_ids = sorted({father.id, mother.id, *shared_children})
        families.append(
            NuclearFamily(
                family_key=family_key,
                name=family_display_name(naming_contact, family_key),
                father_contact_id=father_id,
                mother_contact_id=mother_id,
                root_contact_id=root_contact_id,
                member_contact_ids=member_ids,
            )
        )

    single_parent_children: dict[int, set[int]] = {}
    for parent_id, child_ids in children_by_parent.items():
        for child_id in child_ids:
            if child_id in couple_child_ids:
                continue
            single_parent_children.setdefault(parent_id, set()).add(child_id)

    for parent_id, child_ids in sorted(single_parent_children.items()):
        parent = contacts_by_id.get(parent_id)
        if parent is None or not child_ids:
            continue

        if parent.gender == "male":
            father_id: int | None = parent_id
            mother_id: int | None = None
        else:
            father_id = None
            mother_id = parent_id

        family_key = make_family_key(father_id, mother_id)
        if any(existing.family_key == family_key for existing in families):
            continue

        families.append(
            NuclearFamily(
                family_key=family_key,
                name=family_display_name(parent, family_key),
                father_contact_id=father_id,
                mother_contact_id=mother_id,
                root_contact_id=parent_id,
                member_contact_ids=sorted({parent_id, *child_ids}),
            )
        )

    families.sort(key=lambda family: (family.name.lower(), family.family_key))
    return families


async def load_contacts_and_edges(
    conn: asyncpg.Connection,
    user_id: int,
) -> tuple[list[_ContactInfo], list[tuple[int, int]], list[tuple[int, int]]]:
    """Load contact metadata and genealogical edges for one user."""
    from core.tables import CONTACT_RELATIONSHIPS, CONTACTS

    contact_rows = await conn.fetch(
        f"""
        SELECT id, first_name, gender
        FROM {CONTACTS}
        WHERE user_id = $1
        ORDER BY id ASC
        """,
        user_id,
    )
    contacts = [
        _ContactInfo(
            id=row["id"],
            first_name=row["first_name"],
            gender=row["gender"],
        )
        for row in contact_rows
    ]

    edge_rows = await conn.fetch(
        f"""
        SELECT from_contact_id, to_contact_id, relationship_type
        FROM {CONTACT_RELATIONSHIPS}
        WHERE user_id = $1
          AND relationship_type IN ('parent', 'spouse')
        ORDER BY id ASC
        """,
        user_id,
    )

    parent_edges: list[tuple[int, int]] = []
    spouse_edges: list[tuple[int, int]] = []
    for row in edge_rows:
        if row["relationship_type"] == "parent":
            parent_edges.append((row["from_contact_id"], row["to_contact_id"]))
        else:
            spouse_edges.append((row["from_contact_id"], row["to_contact_id"]))

    return contacts, parent_edges, spouse_edges


async def discover_nuclear_families_from_db(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[NuclearFamily]:
    """Discover all nuclear families for one user from the database."""
    contacts, parent_edges, spouse_edges = await load_contacts_and_edges(conn, user_id)
    return discover_nuclear_families(contacts, parent_edges, spouse_edges)


def families_for_contact(
    families: list[NuclearFamily],
    contact_id: int,
) -> list[NuclearFamily]:
    """Return families that include the given contact."""
    return [
        family
        for family in families
        if contact_id in family.member_contact_ids
    ]


def family_by_key(
    families: list[NuclearFamily],
    family_key: str,
) -> NuclearFamily | None:
    """Look up one family by its stable key."""
    for family in families:
        if family.family_key == family_key:
            return family
    return None
