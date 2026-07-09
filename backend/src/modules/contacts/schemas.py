# keel_api/src/modules/contacts/schemas.py

"""Pydantic models for contacts."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field

from modules.media.schemas import MediaPublic


class ContactFamilyGroupPublic(BaseModel):
    id: str
    name: str


class ContactTagPublic(BaseModel):
    id: int
    name: str
    color_hex: str
    contact_count: int = 0


class ContactTagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    color_hex: str | None = None


class ContactTagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    color_hex: str | None = None


class ContactCreate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    gender: str | None = None
    birth_date: date | None = None
    birth_date_year_known: bool = True
    death_date: date | None = None
    notes: str = ""
    status: str = "active"
    tag_ids: list[int] = Field(default_factory=list)


class ContactUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    gender: str | None = None
    birth_date: date | None = None
    birth_date_year_known: bool | None = None
    death_date: date | None = None
    notes: str | None = None
    status: str | None = None
    tag_ids: list[int] | None = None


class ContactPublic(BaseModel):
    id: int
    first_name: str | None
    last_name: str | None
    gender: str | None
    birth_date: date | None
    birth_date_year_known: bool
    death_date: date | None
    notes: str
    status: str
    is_self: bool
    photo: MediaPublic | None = None
    family_groups: list[ContactFamilyGroupPublic] = Field(default_factory=list)
    tags: list[ContactTagPublic] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ContactRelationshipCreate(BaseModel):
    from_contact_id: int
    to_contact_id: int
    relationship_type: str


class ContactRelationshipUpdate(BaseModel):
    from_contact_id: int
    to_contact_id: int
    relationship_type: str


class ContactRelationshipPublic(BaseModel):
    id: int
    from_contact_id: int
    to_contact_id: int
    from_first_name: str | None
    from_last_name: str | None
    to_first_name: str | None
    to_last_name: str | None
    relationship_type: str
    created_at: datetime
    updated_at: datetime


class FamilyGroupPublic(BaseModel):
    id: str
    name: str
    father_contact_id: int | None
    mother_contact_id: int | None
    root_contact_id: int | None
    member_count: int


class FamilyGroupDetailPublic(FamilyGroupPublic):
    member_contact_ids: list[int]


class FamilyTreeNodePublic(BaseModel):
    contact: ContactPublic
    depth: int


class FamilyTreeEdgePublic(BaseModel):
    id: int
    from_contact_id: int
    to_contact_id: int
    relationship_type: str


class FamilyTreePublic(BaseModel):
    group_id: str
    root_contact_id: int | None
    nodes: list[FamilyTreeNodePublic]
    edges: list[FamilyTreeEdgePublic]
