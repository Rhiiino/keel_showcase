# keel_api/src/modules/figures/service.py

"""Business logic for figures."""

from __future__ import annotations

from datetime import date

import asyncpg

from core.database import get_pool
from core.errors import AppError
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.figures import config, repository
from modules.figures.schemas import FigureCreate, FigurePublic, FigureUpdate
from modules.media import service as media_service
from modules.media.schemas import MediaPublic



# ----- Helpers
async def _photo_for_figure(
    conn: asyncpg.Connection,
    figure_id: int,
) -> MediaPublic | None:
    """Load photo attachment for a figure."""
    attachment = await media_service.get_attachment_for_entity_role(
        conn,
        entity_type="figure",
        entity_id=figure_id,
        role="photo",
    )
    return attachment.media if attachment else None


def _row_to_figure_public(
    row: asyncpg.Record,
    *,
    photo: MediaPublic | None = None,
) -> FigurePublic:
    return FigurePublic(
        id=row["id"],
        first_name=row["first_name"],
        last_name=row["last_name"],
        gender=row["gender"],
        birth_date=row["birth_date"],
        birth_date_year_known=row["birth_date_year_known"],
        death_date=row["death_date"],
        notes=row["notes"],
        status=row["status"],
        photo=photo,
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


async def _figure_public_from_row(
    conn: asyncpg.Connection,
    row: asyncpg.Record,
) -> FigurePublic:
    photo = await _photo_for_figure(conn, row["id"])
    return _row_to_figure_public(row, photo=photo)


async def _get_figure_row_or_404(
    conn: asyncpg.Connection,
    user_id: int,
    figure_id: int,
) -> asyncpg.Record:
    row = await repository.get_figure_by_id(conn, user_id, figure_id)
    if row is None:
        raise AppError("Figure not found.", status_code=404)
    return row


def _validate_status(status: str) -> None:
    if status not in config.VALID_FIGURE_STATUSES:
        raise AppError("Invalid figure status.", status_code=400)


def _validate_gender(gender: str | None) -> None:
    if gender is not None and gender not in config.VALID_FIGURE_GENDERS:
        raise AppError("Invalid figure gender.", status_code=400)


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



# ----- Figures CRUD
async def list_figures(user_id: int) -> list[FigurePublic]:
    """List all figures for one user."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_figures(conn, user_id)
        results: list[FigurePublic] = []
        for row in rows:
            results.append(await _figure_public_from_row(conn, row))
        return results


async def get_figure(user_id: int, figure_id: int) -> FigurePublic:
    """Fetch one figure by id."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await _get_figure_row_or_404(conn, user_id, figure_id)
        return await _figure_public_from_row(conn, row)


async def create_figure(user_id: int, payload: FigureCreate) -> FigurePublic:
    """Create a new figure."""
    _validate_status(payload.status)
    _validate_gender(payload.gender)
    birth_date, birth_date_year_known = _normalize_birth_date_fields(
        payload.birth_date,
        payload.birth_date_year_known,
    )
    _validate_birth_date(birth_date, birth_date_year_known)
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.insert_figure(
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
    return await get_figure(user_id, row["id"])


async def update_figure(
    user_id: int,
    figure_id: int,
    payload: FigureUpdate,
) -> FigurePublic:
    """Update one figure."""
    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await _get_figure_row_or_404(conn, user_id, figure_id)
        status = payload.status if payload.status is not None else existing["status"]
        _validate_status(status)
        _validate_gender(payload.gender)
        updates = payload.model_dump(exclude_unset=True)
        birth_date = updates.get("birth_date", existing["birth_date"])
        if "birth_date" in updates and updates["birth_date"] is None:
            birth_date = None
        birth_date_year_known = updates.get(
            "birth_date_year_known",
            existing["birth_date_year_known"],
        )
        birth_date, birth_date_year_known = _normalize_birth_date_fields(
            birth_date,
            birth_date_year_known,
        )
        _validate_birth_date(birth_date, birth_date_year_known)
        row = await repository.update_figure(
            conn,
            user_id=user_id,
            figure_id=figure_id,
            first_name=updates.get("first_name", existing["first_name"]),
            last_name=updates.get("last_name", existing["last_name"]),
            gender=updates.get("gender", existing["gender"]),
            birth_date=birth_date,
            birth_date_year_known=birth_date_year_known,
            death_date=updates.get("death_date", existing["death_date"]),
            notes=updates.get("notes", existing["notes"]),
            status=status,
        )
        if row is None:
            raise AppError("Figure not found.", status_code=404)
    return await get_figure(user_id, figure_id)


async def delete_figure(user_id: int, figure_id: int) -> None:
    """Delete one figure."""
    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await repository.get_figure_by_id(conn, user_id, figure_id)
        if existing is None:
            raise AppError("Figure not found.", status_code=404)
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.FIGURE,
        str(figure_id),
    )
