# keel_api/src/modules/journal/router.py

"""HTTP routes for journal entries (session required)."""

from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.journal import config, service
from modules.journal.schemas import (
    JournalEntryCreate,
    JournalEntryPublic,
    JournalEntryUpdate,
    JournalTagCreate,
    JournalTagPublic,
    JournalTagUpdate,
)

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]



# ----- Journal tags
@router.get(config.TAG_LIST_PATH, response_model=list[JournalTagPublic])
async def list_journal_tags(user: CurrentUser) -> list[JournalTagPublic]:
    """List the current user's journal tags."""
    return await service.list_journal_tags(user.id)


@router.post(
    config.TAG_LIST_PATH,
    response_model=JournalTagPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_journal_tag(
    payload: JournalTagCreate,
    user: CurrentUser,
) -> JournalTagPublic:
    """Create a journal tag for the current user."""
    return await service.create_journal_tag(user.id, payload)


@router.patch(config.TAG_BY_ID_PATH, response_model=JournalTagPublic)
async def update_journal_tag(
    tag_id: int,
    payload: JournalTagUpdate,
    user: CurrentUser,
) -> JournalTagPublic:
    """Update one journal tag."""
    return await service.update_journal_tag(user.id, tag_id, payload)


@router.delete(config.TAG_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_journal_tag(tag_id: int, user: CurrentUser) -> None:
    """Delete one journal tag."""
    await service.delete_journal_tag(user.id, tag_id)



# ----- Journal entries
@router.get(config.ENTRIES_PATH, response_model=list[JournalEntryPublic])
async def list_entries(
    user: CurrentUser,
    query: str | None = Query(default=None),
    entry_date_from: date | None = Query(default=None),
    entry_date_to: date | None = Query(default=None),
    tag_ids: list[int] | None = Query(default=None),
) -> list[JournalEntryPublic]:
    """List the current user's journal entries."""
    return await service.list_entries(
        user.id,
        query=query,
        entry_date_from=entry_date_from,
        entry_date_to=entry_date_to,
        tag_ids=tag_ids,
    )


@router.post(
    config.ENTRIES_PATH,
    response_model=JournalEntryPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_entry(
    payload: JournalEntryCreate,
    user: CurrentUser,
) -> JournalEntryPublic:
    """Create a journal entry for the current user."""
    return await service.create_entry(user.id, payload)


@router.get(config.ENTRY_BY_ID_PATH, response_model=JournalEntryPublic)
async def get_entry(entry_id: int, user: CurrentUser) -> JournalEntryPublic:
    """Return one journal entry."""
    return await service.get_entry(user.id, entry_id)


@router.patch(config.ENTRY_BY_ID_PATH, response_model=JournalEntryPublic)
async def update_entry(
    entry_id: int,
    payload: JournalEntryUpdate,
    user: CurrentUser,
) -> JournalEntryPublic:
    """Update one journal entry."""
    return await service.update_entry(user.id, entry_id, payload)


@router.delete(config.ENTRY_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(entry_id: int, user: CurrentUser) -> None:
    """Delete one journal entry."""
    await service.delete_entry(user.id, entry_id)
