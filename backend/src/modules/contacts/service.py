# keel_api/src/modules/contacts/service.py

"""Business logic for contacts, relationships, family groups, and photos."""

from __future__ import annotations

import re

import asyncpg
from asyncpg.exceptions import UniqueViolationError

from core.database import get_pool
from core.errors import AppError
from modules.contacts import (
    config,
    families_service,
    relationships_repository,
    repository,
    tree_service,
)
from modules.contacts.families_service import NuclearFamily
from modules.contacts import tags_repository
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.contacts.schemas import (
    ContactCreate,
    ContactFamilyGroupPublic,
    ContactPublic,
    ContactRelationshipCreate,
    ContactRelationshipPublic,
    ContactRelationshipUpdate,
    ContactTagCreate,
    ContactTagPublic,
    ContactTagUpdate,
    ContactUpdate,
    FamilyGroupDetailPublic,
    FamilyGroupPublic,
    FamilyTreePublic,
)
from modules.media import service as media_service
from modules.media.schemas import MediaPublic



# ----- Helpers
def _family_group_summary(family: NuclearFamily) -> ContactFamilyGroupPublic:
    return ContactFamilyGroupPublic(
        id=family.family_key,
        name=family.name,
    )


def _family_group_public(family: NuclearFamily) -> FamilyGroupPublic:
    return FamilyGroupPublic(
        id=family.family_key,
        name=family.name,
        father_contact_id=family.father_contact_id,
        mother_contact_id=family.mother_contact_id,
        root_contact_id=family.root_contact_id,
        member_count=len(family.member_contact_ids),
    )


def _family_group_detail(family: NuclearFamily) -> FamilyGroupDetailPublic:
    public = _family_group_public(family)
    return FamilyGroupDetailPublic(
        **public.model_dump(),
        member_contact_ids=family.member_contact_ids,
    )


def _family_groups_by_contact(
    families: list[NuclearFamily],
) -> dict[int, list[ContactFamilyGroupPublic]]:
    grouped: dict[int, list[ContactFamilyGroupPublic]] = {}
    for family in families:
        summary = _family_group_summary(family)
        for contact_id in family.member_contact_ids:
            grouped.setdefault(contact_id, []).append(summary)
    for summaries in grouped.values():
        summaries.sort(key=lambda item: item.name.lower())
    return grouped


async def _photo_for_contact(
    conn: asyncpg.Connection,
    contact_id: int,
) -> MediaPublic | None:
    """Load photo attachment for a contact."""
    attachment = await media_service.get_attachment_for_entity_role(
        conn,
        entity_type="contact",
        entity_id=contact_id,
        role="photo",
    )
    return attachment.media if attachment else None


def _row_to_contact_public(
    row: asyncpg.Record,
    *,
    family_groups: list[ContactFamilyGroupPublic],
    photo: MediaPublic | None = None,
    tags: list[ContactTagPublic] | None = None,
) -> ContactPublic:
    return ContactPublic(
        id=row["id"],
        first_name=row["first_name"],
        last_name=row["last_name"],
        gender=row["gender"],
        birth_date=row["birth_date"],
        birth_date_year_known=row["birth_date_year_known"],
        death_date=row["death_date"],
        notes=row["notes"],
        status=row["status"],
        is_self=row["is_self"],
        photo=photo,
        family_groups=family_groups,
        tags=tags or [],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _record_to_tag(row: asyncpg.Record) -> ContactTagPublic:
    return ContactTagPublic(
        id=row["id"],
        name=row["name"],
        color_hex=row["color_hex"],
        contact_count=int(row.get("contact_count") or 0),
    )


def _normalize_tag_name(name: str) -> str:
    normalized = name.strip()
    if not normalized:
        raise AppError("Tag name is required.", status_code=400)
    if len(normalized) > 80:
        raise AppError("Tag name must be at most 80 characters.", status_code=400)
    return normalized


def _normalize_tag_color(color_hex: str | None) -> str:
    if color_hex is None:
        return config.DEFAULT_TAG_COLOR_HEX
    normalized = color_hex.strip()
    if not normalized:
        return config.DEFAULT_TAG_COLOR_HEX
    if re.fullmatch(r"#[0-9A-Fa-f]{6}", normalized) is None:
        raise AppError(
            "color_hex must be a valid 6-digit hex color like #06B6D4.",
            status_code=400,
        )
    return normalized.upper()


def _dedupe_tag_ids(tag_ids: list[int]) -> list[int]:
    seen: set[int] = set()
    deduped: list[int] = []
    for tag_id in tag_ids:
        if tag_id in seen:
            continue
        seen.add(tag_id)
        deduped.append(tag_id)
    return deduped


async def _validate_contact_tag_ids(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_ids: list[int],
) -> list[int]:
    deduped = _dedupe_tag_ids(tag_ids)
    if not deduped:
        return []

    owned_count = await tags_repository.count_owned_tags(
        conn,
        user_id=user_id,
        tag_ids=deduped,
    )
    if owned_count != len(deduped):
        raise AppError("One or more tags were not found.", status_code=400)
    return deduped


async def _tags_for_contact_rows(
    conn: asyncpg.Connection,
    rows: list[asyncpg.Record],
) -> dict[int, list[ContactTagPublic]]:
    contact_ids = [row["id"] for row in rows]
    grouped = await tags_repository.fetch_tags_for_contacts(conn, contact_ids)
    return {
        contact_id: [
            ContactTagPublic(
                id=tag_row["id"],
                name=tag_row["name"],
                color_hex=tag_row["color_hex"],
            )
            for tag_row in tag_rows
        ]
        for contact_id, tag_rows in grouped.items()
    }


async def _contact_public_from_row(
    conn: asyncpg.Connection,
    user_id: int,
    row: asyncpg.Record,
    *,
    family_groups_by_contact: dict[int, list[ContactFamilyGroupPublic]] | None = None,
    tags_by_contact: dict[int, list[ContactTagPublic]] | None = None,
) -> ContactPublic:
    if family_groups_by_contact is None:
        families = await families_service.discover_nuclear_families_from_db(conn, user_id)
        family_groups_by_contact = _family_groups_by_contact(families)
    if tags_by_contact is None:
        tags_by_contact = await _tags_for_contact_rows(conn, rows=[row])
    family_groups = family_groups_by_contact.get(row["id"], [])
    photo = await _photo_for_contact(conn, row["id"])
    return _row_to_contact_public(
        row,
        family_groups=family_groups,
        photo=photo,
        tags=tags_by_contact.get(row["id"], []),
    )


async def _get_contact_row_or_404(
    conn: asyncpg.Connection,
    user_id: int,
    contact_id: int,
) -> asyncpg.Record:
    row = await repository.get_contact_by_id(conn, user_id, contact_id)
    if row is None:
        raise AppError("Contact not found.", status_code=404)
    return row


def _validate_status(status: str) -> None:
    if status not in config.VALID_CONTACT_STATUSES:
        raise AppError("Invalid contact status.", status_code=400)


def _validate_gender(gender: str | None) -> None:
    if gender is not None and gender not in config.VALID_CONTACT_GENDERS:
        raise AppError("Invalid contact gender.", status_code=400)


def _validate_relationship_type(relationship_type: str) -> None:
    if relationship_type not in config.VALID_RELATIONSHIP_TYPES:
        raise AppError("Invalid relationship type.", status_code=400)


def _validate_birth_date(
    birth_date: date | None,
    birth_date_year_known: bool,
) -> None:
    if birth_date is None:
        return
    if birth_date_year_known:
        if birth_date.year == config.BIRTH_DATE_UNKNOWN_YEAR:
            raise AppError(
                "birth_date cannot use the placeholder year when birth_date_year_known is true.",
                status_code=400,
            )
        return
    if birth_date.year != config.BIRTH_DATE_UNKNOWN_YEAR:
        raise AppError(
            "birth_date must use the placeholder year when birth_date_year_known is false.",
            status_code=400,
        )


def _normalize_birth_date_fields(
    birth_date: date | None,
    birth_date_year_known: bool,
) -> tuple[date | None, bool]:
    if birth_date is None:
        return None, True
    return birth_date, birth_date_year_known


def _row_to_relationship_public(row: asyncpg.Record) -> ContactRelationshipPublic:
    return ContactRelationshipPublic(
        id=row["id"],
        from_contact_id=row["from_contact_id"],
        to_contact_id=row["to_contact_id"],
        from_first_name=row["from_first_name"],
        from_last_name=row["from_last_name"],
        to_first_name=row["to_first_name"],
        to_last_name=row["to_last_name"],
        relationship_type=row["relationship_type"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


# ----- Contact tags
async def list_contact_tags(user_id: int) -> list[ContactTagPublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await tags_repository.list_user_tags(conn, user_id)
    return [_record_to_tag(row) for row in rows]


async def create_contact_tag(user_id: int, payload: ContactTagCreate) -> ContactTagPublic:
    name = _normalize_tag_name(payload.name)
    color_hex = _normalize_tag_color(payload.color_hex)

    pool = get_pool()
    async with pool.acquire() as conn:
        try:
            row = await tags_repository.insert_user_tag(
                conn,
                user_id=user_id,
                name=name,
                color_hex=color_hex,
            )
        except UniqueViolationError as exc:
            raise AppError("Tag name already exists.", status_code=409) from exc

    return _record_to_tag(row)


async def update_contact_tag(
    user_id: int,
    tag_id: int,
    payload: ContactTagUpdate,
) -> ContactTagPublic:
    name = (
        _normalize_tag_name(payload.name)
        if payload.name is not None
        else None
    )
    color_hex = (
        _normalize_tag_color(payload.color_hex)
        if payload.color_hex is not None
        else None
    )

    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await tags_repository.get_user_tag(conn, user_id=user_id, tag_id=tag_id)
        if existing is None:
            raise AppError("Tag not found.", status_code=404)

        resolved_name = name if name is not None else existing["name"]
        resolved_color = (
            color_hex if payload.color_hex is not None else existing["color_hex"]
        )

        try:
            row = await tags_repository.update_user_tag(
                conn,
                user_id=user_id,
                tag_id=tag_id,
                name=resolved_name,
                color_hex=resolved_color,
            )
        except UniqueViolationError as exc:
            raise AppError("Tag name already exists.", status_code=409) from exc

        if row is None:
            raise AppError("Tag not found.", status_code=404)

    return _record_to_tag(row)


async def delete_contact_tag(user_id: int, tag_id: int) -> None:
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.CONTACT_TAG,
        str(tag_id),
    )



# ----- Contacts
async def list_contacts(user_id: int) -> list[ContactPublic]:
    """List contacts for the current user."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_contacts(conn, user_id)
        families = await families_service.discover_nuclear_families_from_db(conn, user_id)
        family_groups_by_contact = _family_groups_by_contact(families)
        tags_by_contact = await _tags_for_contact_rows(conn, rows)
        results: list[ContactPublic] = []
        for row in rows:
            photo = await _photo_for_contact(conn, row["id"])
            results.append(
                _row_to_contact_public(
                    row,
                    family_groups=family_groups_by_contact.get(row["id"], []),
                    photo=photo,
                    tags=tags_by_contact.get(row["id"], []),
                )
            )
        return results


def _contact_display_name(contact: ContactPublic) -> str:
    parts = [contact.first_name or "", contact.last_name or ""]
    name = " ".join(part.strip() for part in parts if part and part.strip())
    return name or f"Contact #{contact.id}"


async def search_contacts(user_id: int, query: str) -> list[ContactPublic]:
    """Search contacts by first or last name."""
    contacts = await list_contacts(user_id)
    needle = query.strip().lower()
    if not needle:
        return contacts
    return [
        contact
        for contact in contacts
        if needle in _contact_display_name(contact).lower()
        or needle in (contact.first_name or "").lower()
        or needle in (contact.last_name or "").lower()
    ]


async def get_contact(user_id: int, contact_id: int) -> ContactPublic:
    """Fetch one contact by id."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await _get_contact_row_or_404(conn, user_id, contact_id)
        return await _contact_public_from_row(conn, user_id, row)


async def get_or_create_self_contact(user_id: int, display_name: str) -> ContactPublic:
    """Return the self contact, creating it from the user's display name if missing."""
    parts = display_name.strip().split(maxsplit=1)
    first_name = parts[0] if parts else "Me"
    last_name = parts[1] if len(parts) > 1 else None

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            existing = await repository.get_self_contact(conn, user_id)
            if existing is not None:
                return await _contact_public_from_row(conn, user_id, existing)

            row = await repository.insert_contact(
                conn,
                user_id=user_id,
                first_name=first_name,
                last_name=last_name,
                gender=None,
                birth_date=None,
                birth_date_year_known=True,
                death_date=None,
                notes="",
                status="active",
                is_self=True,
            )
            await repository.set_user_contact_id(
                conn,
                user_id=user_id,
                contact_id=row["id"],
            )
        return await _contact_public_from_row(conn, user_id, row)


async def create_contact(user_id: int, payload: ContactCreate) -> ContactPublic:
    """Create a new contact."""
    _validate_status(payload.status)
    _validate_gender(payload.gender)
    birth_date, birth_date_year_known = _normalize_birth_date_fields(
        payload.birth_date,
        payload.birth_date_year_known,
    )
    _validate_birth_date(birth_date, birth_date_year_known)
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await repository.insert_contact(
                conn,
                user_id=user_id,
                first_name=payload.first_name,
                last_name=payload.last_name,
                gender=payload.gender,
                birth_date=birth_date,
                birth_date_year_known=birth_date_year_known,
                death_date=payload.death_date,
                notes=payload.notes,
                status=payload.status,
            )
            tag_ids = await _validate_contact_tag_ids(
                conn,
                user_id=user_id,
                tag_ids=payload.tag_ids,
            )
            if tag_ids:
                await tags_repository.replace_contact_tags(
                    conn,
                    user_id=user_id,
                    contact_id=row["id"],
                    tag_ids=tag_ids,
                )
        return await get_contact(user_id, row["id"])


async def update_contact(
    user_id: int,
    contact_id: int,
    payload: ContactUpdate,
) -> ContactPublic:
    """Update one contact."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            existing = await _get_contact_row_or_404(conn, user_id, contact_id)
            status = payload.status if payload.status is not None else existing["status"]
            _validate_status(status)
            _validate_gender(payload.gender)
            updates = payload.model_dump(exclude_unset=True)
            birth_date = updates.get("birth_date", existing["birth_date"])
            birth_date_year_known = updates.get(
                "birth_date_year_known",
                existing["birth_date_year_known"],
            )
            birth_date, birth_date_year_known = _normalize_birth_date_fields(
                birth_date,
                birth_date_year_known,
            )
            _validate_birth_date(birth_date, birth_date_year_known)
            row = await repository.update_contact(
                conn,
                user_id=user_id,
                contact_id=contact_id,
                first_name=payload.first_name
                if payload.first_name is not None
                else existing["first_name"],
                last_name=payload.last_name
                if payload.last_name is not None
                else existing["last_name"],
                gender=payload.gender if payload.gender is not None else existing["gender"],
                birth_date=birth_date,
                birth_date_year_known=birth_date_year_known,
                death_date=payload.death_date
                if payload.death_date is not None
                else existing["death_date"],
                notes=payload.notes if payload.notes is not None else existing["notes"],
                status=status,
            )
            assert row is not None
            if payload.tag_ids is not None:
                tag_ids = await _validate_contact_tag_ids(
                    conn,
                    user_id=user_id,
                    tag_ids=payload.tag_ids,
                )
                await tags_repository.replace_contact_tags(
                    conn,
                    user_id=user_id,
                    contact_id=contact_id,
                    tag_ids=tag_ids,
                )
        return await get_contact(user_id, contact_id)


async def delete_contact(user_id: int, contact_id: int) -> None:
    """Delete one contact."""
    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await repository.get_contact_by_id(conn, user_id, contact_id)
        if existing is None:
            raise AppError("Contact not found.", status_code=404)
        if existing["is_self"]:
            raise AppError("Cannot delete the self contact.", status_code=400)
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.CONTACT,
        str(contact_id),
    )



# ----- Relationships
async def list_relationships(user_id: int) -> list[ContactRelationshipPublic]:
    """List all contact relationships for the current user."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await relationships_repository.list_relationships(conn, user_id)
    return [_row_to_relationship_public(row) for row in rows]


async def list_contact_relationships(
    user_id: int,
    contact_id: int,
) -> list[ContactRelationshipPublic]:
    """List relationships for one contact."""
    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_contact_row_or_404(conn, user_id, contact_id)
        rows = await relationships_repository.list_relationships_for_contact(
            conn,
            user_id,
            contact_id,
        )
    return [_row_to_relationship_public(row) for row in rows]


async def create_relationship(
    user_id: int,
    payload: ContactRelationshipCreate,
) -> ContactRelationshipPublic:
    """Create a contact relationship."""
    _validate_relationship_type(payload.relationship_type)
    if payload.from_contact_id == payload.to_contact_id:
        raise AppError("A contact cannot relate to itself.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await _get_contact_row_or_404(conn, user_id, payload.from_contact_id)
            await _get_contact_row_or_404(conn, user_id, payload.to_contact_id)
            try:
                row = await relationships_repository.insert_relationship(
                    conn,
                    user_id=user_id,
                    from_contact_id=payload.from_contact_id,
                    to_contact_id=payload.to_contact_id,
                    relationship_type=payload.relationship_type,
                )
            except asyncpg.UniqueViolationError:
                raise AppError("Relationship already exists.", status_code=409) from None
            except asyncpg.CheckViolationError:
                raise AppError("Invalid relationship.", status_code=400) from None
    return _row_to_relationship_public(row)


async def update_relationship(
    user_id: int,
    relationship_id: int,
    payload: ContactRelationshipUpdate,
) -> ContactRelationshipPublic:
    """Update one contact relationship."""
    _validate_relationship_type(payload.relationship_type)
    if payload.from_contact_id == payload.to_contact_id:
        raise AppError("A contact cannot relate to itself.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            existing = await relationships_repository.get_relationship_by_id(
                conn,
                user_id,
                relationship_id,
            )
            if existing is None:
                raise AppError("Relationship not found.", status_code=404)
            await _get_contact_row_or_404(conn, user_id, payload.from_contact_id)
            await _get_contact_row_or_404(conn, user_id, payload.to_contact_id)
            try:
                row = await relationships_repository.update_relationship(
                    conn,
                    user_id=user_id,
                    relationship_id=relationship_id,
                    from_contact_id=payload.from_contact_id,
                    to_contact_id=payload.to_contact_id,
                    relationship_type=payload.relationship_type,
                )
            except asyncpg.UniqueViolationError:
                raise AppError("Relationship already exists.", status_code=409) from None
            except asyncpg.CheckViolationError:
                raise AppError("Invalid relationship.", status_code=400) from None
    assert row is not None
    return _row_to_relationship_public(row)


async def delete_relationship(user_id: int, relationship_id: int) -> None:
    """Delete one contact relationship."""
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.CONTACT_RELATIONSHIP,
        str(relationship_id),
    )



# ----- Family groups (computed nuclear families)
async def _load_discovered_families(
    conn: asyncpg.Connection,
    user_id: int,
) -> list[NuclearFamily]:
    return await families_service.discover_nuclear_families_from_db(conn, user_id)


async def list_family_groups(user_id: int) -> list[FamilyGroupPublic]:
    """List computed nuclear families."""
    pool = get_pool()
    async with pool.acquire() as conn:
        families = await _load_discovered_families(conn, user_id)
    return [_family_group_public(family) for family in families]


async def get_family_group(user_id: int, family_key: str) -> FamilyGroupDetailPublic:
    """Fetch one computed family with member ids."""
    pool = get_pool()
    async with pool.acquire() as conn:
        families = await _load_discovered_families(conn, user_id)
    family = families_service.family_by_key(families, family_key)
    if family is None:
        raise AppError("Family group not found.", status_code=404)
    return _family_group_detail(family)


async def get_family_group_tree(user_id: int, family_key: str) -> FamilyTreePublic:
    """Return the induced subgraph for one computed family."""
    contacts = await list_contacts(user_id)
    contacts_by_id = {contact.id: contact for contact in contacts}
    pool = get_pool()
    async with pool.acquire() as conn:
        families = await _load_discovered_families(conn, user_id)
        family = families_service.family_by_key(families, family_key)
        if family is None:
            raise AppError("Family group not found.", status_code=404)
        return await tree_service.build_family_tree(
            conn,
            user_id=user_id,
            family_key=family.family_key,
            member_ids=family.member_contact_ids,
            root_contact_id=family.root_contact_id,
            contacts_by_id=contacts_by_id,
        )


async def get_merged_family_trees(
    user_id: int,
    family_keys: list[str],
) -> list[FamilyTreePublic]:
    """Return connected trees for multiple selected families with bridging edges."""
    if not family_keys:
        return []

    contacts = await list_contacts(user_id)
    contacts_by_id = {contact.id: contact for contact in contacts}
    pool = get_pool()
    async with pool.acquire() as conn:
        families = await _load_discovered_families(conn, user_id)
        selected = []
        for family_key in family_keys:
            family = families_service.family_by_key(families, family_key)
            if family is None:
                raise AppError("Family group not found.", status_code=404)
            selected.append(family)
        return await tree_service.build_merged_family_trees(
            conn,
            user_id=user_id,
            selected_families=selected,
            contacts_by_id=contacts_by_id,
        )
