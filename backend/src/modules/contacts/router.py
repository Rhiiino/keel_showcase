# keel_api/src/modules/contacts/router.py

"""HTTP routes for contacts (session required)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import Response

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.contacts import config, service
from modules.contacts.schemas import (
    ContactCreate,
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

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]



# ----- Contact tags (before /{contact_id})
@router.get(config.TAG_LIST_PATH, response_model=list[ContactTagPublic])
async def list_contact_tags(user: CurrentUser) -> list[ContactTagPublic]:
    """List the current user's contact tags."""
    return await service.list_contact_tags(user.id)


@router.post(
    config.TAG_LIST_PATH,
    response_model=ContactTagPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_contact_tag(
    payload: ContactTagCreate,
    user: CurrentUser,
) -> ContactTagPublic:
    """Create a contact tag for the current user."""
    return await service.create_contact_tag(user.id, payload)


@router.patch(config.TAG_BY_ID_PATH, response_model=ContactTagPublic)
async def update_contact_tag(
    tag_id: int,
    payload: ContactTagUpdate,
    user: CurrentUser,
) -> ContactTagPublic:
    """Update one contact tag."""
    return await service.update_contact_tag(user.id, tag_id, payload)


@router.delete(config.TAG_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact_tag(tag_id: int, user: CurrentUser) -> Response:
    """Delete one contact tag."""
    await service.delete_contact_tag(user.id, tag_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)



# ----- Contacts (static paths before /{contact_id})
@router.get(config.LIST_CONTACTS_PATH, response_model=list[ContactPublic])
async def list_contacts(user: CurrentUser) -> list[ContactPublic]:
    """List contacts for the current user."""
    return await service.list_contacts(user.id)


@router.get(config.CONTACT_SELF_PATH, response_model=ContactPublic)
async def get_self_contact(user: CurrentUser) -> ContactPublic:
    """Return the self contact, creating it if missing."""
    return await service.get_or_create_self_contact(user.id, user.display_name)


@router.post(
    config.LIST_CONTACTS_PATH,
    response_model=ContactPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_contact(
    payload: ContactCreate,
    user: CurrentUser,
) -> ContactPublic:
    """Create a new contact."""
    return await service.create_contact(user.id, payload)



# ----- Relationships (before /{contact_id})
@router.get(config.RELATIONSHIP_LIST_PATH, response_model=list[ContactRelationshipPublic])
async def list_relationships(user: CurrentUser) -> list[ContactRelationshipPublic]:
    """List all contact relationships for the current user."""
    return await service.list_relationships(user.id)


@router.post(
    config.RELATIONSHIP_LIST_PATH,
    response_model=ContactRelationshipPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_relationship(
    payload: ContactRelationshipCreate,
    user: CurrentUser,
) -> ContactRelationshipPublic:
    """Create a contact relationship."""
    return await service.create_relationship(user.id, payload)


@router.patch(config.RELATIONSHIP_BY_ID_PATH, response_model=ContactRelationshipPublic)
async def update_relationship(
    relationship_id: int,
    payload: ContactRelationshipUpdate,
    user: CurrentUser,
) -> ContactRelationshipPublic:
    """Update one contact relationship."""
    return await service.update_relationship(user.id, relationship_id, payload)


@router.delete(config.RELATIONSHIP_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_relationship(
    relationship_id: int,
    user: CurrentUser,
) -> Response:
    """Delete one contact relationship."""
    await service.delete_relationship(user.id, relationship_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)



# ----- Family groups (computed; before /{contact_id})
@router.get(config.FAMILY_GROUP_LIST_PATH, response_model=list[FamilyGroupPublic])
async def list_family_groups(user: CurrentUser) -> list[FamilyGroupPublic]:
    """List computed nuclear families."""
    return await service.list_family_groups(user.id)


@router.get(config.FAMILY_GROUP_MERGED_TREE_PATH, response_model=list[FamilyTreePublic])
async def get_merged_family_trees(
    user: CurrentUser,
    family_keys: Annotated[list[str], Query(min_length=1)],
) -> list[FamilyTreePublic]:
    """Return connected trees for multiple selected families."""
    return await service.get_merged_family_trees(user.id, family_keys)


@router.get(config.FAMILY_GROUP_TREE_PATH, response_model=FamilyTreePublic)
async def get_family_group_tree(family_key: str, user: CurrentUser) -> FamilyTreePublic:
    """Return the family tree subgraph for one computed family."""
    return await service.get_family_group_tree(user.id, family_key)


@router.get(config.FAMILY_GROUP_BY_ID_PATH, response_model=FamilyGroupDetailPublic)
async def get_family_group(family_key: str, user: CurrentUser) -> FamilyGroupDetailPublic:
    """Fetch one computed nuclear family."""
    return await service.get_family_group(user.id, family_key)



# ----- Contacts by id (dynamic — register after static paths)
@router.get(config.CONTACT_BY_ID_PATH, response_model=ContactPublic)
async def get_contact(contact_id: int, user: CurrentUser) -> ContactPublic:
    """Fetch one contact."""
    return await service.get_contact(user.id, contact_id)


@router.patch(config.CONTACT_BY_ID_PATH, response_model=ContactPublic)
async def update_contact(
    contact_id: int,
    payload: ContactUpdate,
    user: CurrentUser,
) -> ContactPublic:
    """Update one contact."""
    return await service.update_contact(user.id, contact_id, payload)


@router.delete(config.CONTACT_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(contact_id: int, user: CurrentUser) -> Response:
    """Delete one contact."""
    await service.delete_contact(user.id, contact_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    config.CONTACT_BY_ID_PATH + "/relationships",
    response_model=list[ContactRelationshipPublic],
)
async def list_contact_relationships(
    contact_id: int,
    user: CurrentUser,
) -> list[ContactRelationshipPublic]:
    """List relationships for one contact."""
    return await service.list_contact_relationships(user.id, contact_id)
