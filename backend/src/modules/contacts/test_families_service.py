# stack_sandbox/backend/src/modules/contacts/test_families_service.py

"""Unit tests for nuclear-family discovery."""

from __future__ import annotations

from modules.contacts.families_service import (
    _ContactInfo,
    discover_nuclear_families,
    family_display_name,
    make_family_key,
    possessive_first_name,
)


def _contact(contact_id: int, first_name: str, gender: str | None) -> _ContactInfo:
    return _ContactInfo(id=contact_id, first_name=first_name, gender=gender)


def test_rajan_anumol_family() -> None:
    contacts = [
        _contact(1, "Rajan", "male"),
        _contact(2, "Anumol", "female"),
        _contact(3, "Ansa", "female"),
        _contact(4, "Midhun", "male"),
        _contact(5, "Anita", "female"),
    ]
    parent_edges = [
        (1, 3),
        (1, 4),
        (1, 5),
        (2, 3),
        (2, 4),
        (2, 5),
    ]
    spouse_edges = [(1, 2)]

    families = discover_nuclear_families(contacts, parent_edges, spouse_edges)

    assert len(families) == 1
    family = families[0]
    assert family.family_key == "1-2"
    assert family.name == "Rajan's family"
    assert family.member_contact_ids == [1, 2, 3, 4, 5]


def test_couple_without_children() -> None:
    contacts = [
        _contact(10, "Linson", "male"),
        _contact(11, "Ansa", "female"),
    ]
    families = discover_nuclear_families(contacts, [], [(10, 11)])

    assert len(families) == 1
    assert families[0].family_key == "10-11"
    assert families[0].member_contact_ids == [10, 11]


def test_single_mother_family() -> None:
    contacts = [
        _contact(20, "Susumma", "female"),
        _contact(21, "Child", "male"),
    ]
    parent_edges = [(20, 21)]

    families = discover_nuclear_families(contacts, parent_edges, [])

    assert len(families) == 1
    assert families[0].family_key == "0-20"
    assert families[0].name == "Susumma's family"
    assert families[0].member_contact_ids == [20, 21]


def test_child_not_duplicated_into_single_parent_unit() -> None:
    contacts = [
        _contact(1, "Father", "male"),
        _contact(2, "Mother", "female"),
        _contact(3, "Child", "male"),
    ]
    parent_edges = [(1, 3), (2, 3)]
    spouse_edges = [(1, 2)]

    families = discover_nuclear_families(contacts, parent_edges, spouse_edges)

    assert len(families) == 1
    assert families[0].family_key == "1-2"


def test_remarriage_distinct_families() -> None:
    contacts = [
        _contact(1, "Father", "male"),
        _contact(2, "MotherA", "female"),
        _contact(3, "MotherB", "female"),
        _contact(4, "ChildA", "male"),
        _contact(5, "ChildB", "female"),
    ]
    parent_edges = [(1, 4), (2, 4), (1, 5), (3, 5)]
    spouse_edges = [(1, 2), (1, 3)]

    families = discover_nuclear_families(contacts, parent_edges, spouse_edges)
    keys = {family.family_key for family in families}

    assert keys == {"1-2", "1-3"}


def test_possessive_name() -> None:
    assert possessive_first_name("Rajan") == "Rajan's"
    assert possessive_first_name("James") == "James'"


def test_family_display_name_fallback() -> None:
    contact = _contact(99, "", None)
    assert family_display_name(contact, "0-99") == "Family 0-99"


def test_make_family_key() -> None:
    assert make_family_key(12, 34) == "12-34"
    assert make_family_key(None, 45) == "0-45"


if __name__ == "__main__":
    test_rajan_anumol_family()
    test_couple_without_children()
    test_single_mother_family()
    test_child_not_duplicated_into_single_parent_unit()
    test_remarriage_distinct_families()
    test_possessive_name()
    test_family_display_name_fallback()
    test_make_family_key()
    print("families_service tests passed")
