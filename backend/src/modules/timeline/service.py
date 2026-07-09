# keel_api/src/modules/timeline/service.py

"""Business logic for timeline events."""

from __future__ import annotations

import re
from datetime import date, datetime, timedelta

import asyncpg
from asyncpg.exceptions import UniqueViolationError

from core.database import get_pool
from core.errors import AppError
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.timeline import config, repository
from modules.timeline.schemas import (
    TimelineEventContactPublic,
    TimelineEventCreate,
    TimelineEventFigurePublic,
    TimelineEventPublic,
    TimelineEventReminderInput,
    TimelineEventReminderPublic,
    TimelineEventUpdate,
    TimelineTagCreate,
    TimelineTagPublic,
    TimelineTagUpdate,
)

MAX_REMINDERS_PER_EVENT = 5



# ----- Record mappers
def _record_to_tag(row: asyncpg.Record) -> TimelineTagPublic:
    """Map a database row to TimelineTagPublic."""
    return TimelineTagPublic(
        id=row["id"],
        name=row["name"],
        description=row.get("description"),
        color_hex=row["color_hex"],
        event_count=int(row.get("event_count") or 0),
        plan_item_count=int(row.get("plan_item_count") or 0),
    )


def _record_to_reminder(row: asyncpg.Record) -> TimelineEventReminderPublic:
    return TimelineEventReminderPublic(
        id=row["id"],
        amount=int(row["amount"]),
        unit=row["unit"],
        sent_at=row.get("sent_at"),
    )


def _record_to_event(
    row: asyncpg.Record,
    *,
    contacts: list[TimelineEventContactPublic] | None = None,
    figures: list[TimelineEventFigurePublic] | None = None,
    tags: list[TimelineTagPublic] | None = None,
    reminders: list[TimelineEventReminderPublic] | None = None,
) -> TimelineEventPublic:
    """Map a database row to TimelineEventPublic."""
    return TimelineEventPublic(
        id=row["id"],
        user_id=row["user_id"],
        subject_name=row["subject_name"],
        description=row["description"],
        start_date=row["start_date"],
        end_date=row["end_date"],
        all_day=bool(row["all_day"]),
        contacts=contacts or [],
        figures=figures or [],
        tags=tags or [],
        reminders=reminders or [],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _map_contact_rows(rows: list[asyncpg.Record]) -> list[TimelineEventContactPublic]:
    return [
        TimelineEventContactPublic(id=row["id"], display_name=row["display_name"])
        for row in rows
    ]



# ----- Validation helpers
def _normalize_subject_name(value: str | None) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed or None


def _validate_date_range(start_date: datetime, end_date: datetime | None) -> None:
    if end_date is not None and end_date < start_date:
        raise AppError("End must be on or after start.", status_code=400)


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


def _normalize_tag_description(description: str | None) -> str | None:
    if description is None:
        return None
    normalized = description.strip()
    if not normalized:
        return None
    if len(normalized) > 512:
        raise AppError("Tag description must be at most 512 characters.", status_code=400)
    return normalized


def _dedupe_tag_ids(tag_ids: list[int]) -> list[int]:
    seen: set[int] = set()
    deduped: list[int] = []
    for tag_id in tag_ids:
        if tag_id in seen:
            continue
        seen.add(tag_id)
        deduped.append(tag_id)
    return deduped


def _reminder_offset(reminder: TimelineEventReminderInput) -> timedelta:
    if reminder.unit == "minutes":
        return timedelta(minutes=reminder.amount)
    if reminder.unit == "hours":
        return timedelta(hours=reminder.amount)
    return timedelta(days=reminder.amount)


def _validate_reminders(
    reminders: list[TimelineEventReminderInput],
    *,
    start_date: datetime,
) -> list[tuple[int, str]]:
    if len(reminders) > MAX_REMINDERS_PER_EVENT:
        raise AppError(
            f"At most {MAX_REMINDERS_PER_EVENT} reminders are allowed per event.",
            status_code=400,
        )

    now = datetime.now(tz=start_date.tzinfo)
    if reminders and start_date <= now:
        raise AppError("Reminders require a future event start time.", status_code=400)

    seen: set[tuple[int, str]] = set()
    normalized: list[tuple[int, str]] = []
    time_until_start = start_date - now

    for reminder in reminders:
        key = (reminder.amount, reminder.unit)
        if key in seen:
            raise AppError("Duplicate reminder offsets are not allowed.", status_code=400)
        seen.add(key)

        offset = _reminder_offset(reminder)
        if offset >= time_until_start:
            raise AppError(
                "Each reminder must be sooner than the time until the event starts.",
                status_code=400,
            )
        normalized.append(key)

    return normalized


async def _get_owned_event_row(
    conn: asyncpg.Connection,
    user_id: int,
    event_id: int,
) -> asyncpg.Record:
    row = await repository.get_event(conn, event_id)
    if row is None or row["user_id"] != user_id:
        raise AppError("Timeline event not found.", status_code=404)
    return row


async def _resolve_contact_ids(
    conn: asyncpg.Connection,
    user_id: int,
    contact_ids: list[int],
) -> list[int]:
    deduped: list[int] = []
    seen: set[int] = set()
    for contact_id in contact_ids:
        if contact_id in seen:
            continue
        if contact_id < 1:
            raise AppError("Invalid contact id.", status_code=400)
        if not await repository.contact_exists(conn, user_id, contact_id):
            raise AppError(f"Contact {contact_id} not found.", status_code=404)
        seen.add(contact_id)
        deduped.append(contact_id)
    return deduped


def _map_figure_rows(rows: list[asyncpg.Record]) -> list[TimelineEventFigurePublic]:
    return [
        TimelineEventFigurePublic(id=row["id"], display_name=row["display_name"])
        for row in rows
    ]


async def _resolve_figure_ids(
    conn: asyncpg.Connection,
    user_id: int,
    figure_ids: list[int],
) -> list[int]:
    deduped: list[int] = []
    seen: set[int] = set()
    for figure_id in figure_ids:
        if figure_id in seen:
            continue
        if figure_id < 1:
            raise AppError("Invalid figure id.", status_code=400)
        if not await repository.figure_exists(conn, user_id, figure_id):
            raise AppError(f"Figure {figure_id} not found.", status_code=404)
        seen.add(figure_id)
        deduped.append(figure_id)
    return deduped


async def _validate_timeline_tag_ids(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_ids: list[int],
) -> list[int]:
    deduped = _dedupe_tag_ids(tag_ids)
    if not deduped:
        return []

    owned_count = await repository.count_owned_tags(
        conn,
        user_id=user_id,
        tag_ids=deduped,
    )
    if owned_count != len(deduped):
        raise AppError("One or more tags were not found.", status_code=400)
    return deduped


async def _tags_for_event_rows(
    conn: asyncpg.Connection,
    rows: list[asyncpg.Record],
) -> dict[int, list[TimelineTagPublic]]:
    event_ids = [row["id"] for row in rows]
    grouped = await repository.fetch_tags_for_events(conn, event_ids)
    return {
        event_id: [_record_to_tag(tag_row) for tag_row in tag_rows]
        for event_id, tag_rows in grouped.items()
    }


async def _reminders_for_event_rows(
    conn: asyncpg.Connection,
    rows: list[asyncpg.Record],
) -> dict[int, list[TimelineEventReminderPublic]]:
    event_ids = [row["id"] for row in rows]
    grouped = await repository.list_reminders_for_event_ids(conn, event_ids)
    return {
        event_id: [_record_to_reminder(reminder_row) for reminder_row in reminder_rows]
        for event_id, reminder_rows in grouped.items()
    }


async def _hydrate_events(
    conn: asyncpg.Connection,
    rows: list[asyncpg.Record],
) -> list[TimelineEventPublic]:
    if not rows:
        return []

    event_ids = [row["id"] for row in rows]
    contacts_by_event = await repository.list_contacts_for_events(conn, event_ids)
    figures_by_event = await repository.list_figures_for_events(conn, event_ids)
    tags_by_event = await _tags_for_event_rows(conn, rows)
    reminders_by_event = await _reminders_for_event_rows(conn, rows)
    return [
        _record_to_event(
            row,
            contacts=_map_contact_rows(contacts_by_event.get(row["id"], [])),
            figures=_map_figure_rows(figures_by_event.get(row["id"], [])),
            tags=tags_by_event.get(row["id"], []),
            reminders=reminders_by_event.get(row["id"], []),
        )
        for row in rows
    ]



# ----- Timeline tags
async def list_timeline_tags(user_id: int) -> list[TimelineTagPublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_user_tags(conn, user_id)
    return [_record_to_tag(row) for row in rows]


async def create_timeline_tag(user_id: int, payload: TimelineTagCreate) -> TimelineTagPublic:
    name = _normalize_tag_name(payload.name)
    description = _normalize_tag_description(payload.description)
    color_hex = _normalize_tag_color(payload.color_hex)

    pool = get_pool()
    async with pool.acquire() as conn:
        try:
            row = await repository.insert_user_tag(
                conn,
                user_id=user_id,
                name=name,
                description=description,
                color_hex=color_hex,
            )
        except UniqueViolationError as exc:
            raise AppError("Tag name already exists.", status_code=409) from exc

    return _record_to_tag(row)


async def update_timeline_tag(
    user_id: int,
    tag_id: int,
    payload: TimelineTagUpdate,
) -> TimelineTagPublic:
    color_hex = (
        _normalize_tag_color(payload.color_hex)
        if payload.color_hex is not None
        else None
    )

    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await repository.get_user_tag(conn, user_id=user_id, tag_id=tag_id)
        if existing is None:
            raise AppError("Tag not found.", status_code=404)

        resolved_name = (
            _normalize_tag_name(payload.name)
            if payload.name is not None
            else existing["name"]
        )
        resolved_description = (
            _normalize_tag_description(payload.description)
            if "description" in payload.model_fields_set
            else existing.get("description")
        )
        resolved_color = (
            color_hex if payload.color_hex is not None else existing["color_hex"]
        )

        try:
            row = await repository.update_user_tag(
                conn,
                user_id=user_id,
                tag_id=tag_id,
                name=resolved_name,
                description=resolved_description,
                color_hex=resolved_color,
            )
        except UniqueViolationError as exc:
            raise AppError("Tag name already exists.", status_code=409) from exc

        if row is None:
            raise AppError("Tag not found.", status_code=404)

    return _record_to_tag(row)


async def delete_timeline_tag(user_id: int, tag_id: int) -> None:
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.TIMELINE_TAG,
        str(tag_id),
    )



# ----- Timeline events
async def list_events(
    user_id: int,
    *,
    contact_id: int | None = None,
    contact_ids: list[int] | None = None,
    figure_id: int | None = None,
    figure_ids: list[int] | None = None,
    query: str | None = None,
    subject_name: str | None = None,
    start_date_from: date | None = None,
    start_date_to: date | None = None,
    tag_ids: list[int] | None = None,
) -> list[TimelineEventPublic]:
    if (
        start_date_from is not None
        and start_date_to is not None
        and start_date_from > start_date_to
    ):
        raise AppError(
            "start_date_from must be on or before start_date_to.",
            status_code=400,
        )

    normalized_tag_ids = _dedupe_tag_ids(tag_ids or []) if tag_ids else None
    normalized_contact_ids = _dedupe_tag_ids(contact_ids or []) if contact_ids else None
    normalized_figure_ids = _dedupe_tag_ids(figure_ids or []) if figure_ids else None
    normalized_subject_name = subject_name.strip() if subject_name and subject_name.strip() else None

    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_events(
            conn,
            user_id,
            contact_id=contact_id,
            contact_ids=normalized_contact_ids,
            figure_id=figure_id,
            figure_ids=normalized_figure_ids,
            query=query,
            subject_name=normalized_subject_name,
            start_date_from=start_date_from,
            start_date_to=start_date_to,
            tag_ids=normalized_tag_ids,
        )
        return await _hydrate_events(conn, rows)


async def get_event(user_id: int, event_id: int) -> TimelineEventPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await _get_owned_event_row(conn, user_id, event_id)
        contacts_by_event = await repository.list_contacts_for_events(conn, [event_id])
        figures_by_event = await repository.list_figures_for_events(conn, [event_id])
        tags_by_event = await _tags_for_event_rows(conn, [row])
        reminders_by_event = await _reminders_for_event_rows(conn, [row])
        return _record_to_event(
            row,
            contacts=_map_contact_rows(contacts_by_event.get(event_id, [])),
            figures=_map_figure_rows(figures_by_event.get(event_id, [])),
            tags=tags_by_event.get(event_id, []),
            reminders=reminders_by_event.get(event_id, []),
        )


async def create_event(
    user_id: int,
    payload: TimelineEventCreate,
) -> TimelineEventPublic:
    _validate_date_range(payload.start_date, payload.end_date)

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            contact_ids = await _resolve_contact_ids(conn, user_id, payload.contact_ids)
            figure_ids = await _resolve_figure_ids(conn, user_id, payload.figure_ids)
            tag_ids = await _validate_timeline_tag_ids(
                conn,
                user_id=user_id,
                tag_ids=payload.tag_ids,
            )
            reminder_rows = _validate_reminders(payload.reminders, start_date=payload.start_date)
            row = await repository.insert_event(
                conn,
                user_id=user_id,
                subject_name=_normalize_subject_name(payload.subject_name),
                description=payload.description.strip(),
                start_date=payload.start_date,
                end_date=payload.end_date,
                all_day=payload.all_day,
            )
            if row is None:
                raise AppError("Failed to create timeline event.", status_code=500)
            await repository.replace_event_contacts(conn, row["id"], contact_ids)
            await repository.replace_event_figures(conn, row["id"], figure_ids)
            await repository.replace_event_tags(
                conn,
                event_id=row["id"],
                tag_ids=tag_ids,
            )
            await repository.replace_reminders_for_event(conn, row["id"], reminder_rows)
            contacts_by_event = await repository.list_contacts_for_events(conn, [row["id"]])
            figures_by_event = await repository.list_figures_for_events(conn, [row["id"]])
            tags_by_event = await _tags_for_event_rows(conn, [row])
            reminders_by_event = await _reminders_for_event_rows(conn, [row])
            return _record_to_event(
                row,
                contacts=_map_contact_rows(contacts_by_event.get(row["id"], [])),
                figures=_map_figure_rows(figures_by_event.get(row["id"], [])),
                tags=tags_by_event.get(row["id"], []),
                reminders=reminders_by_event.get(row["id"], []),
            )


async def update_event(
    user_id: int,
    event_id: int,
    payload: TimelineEventUpdate,
) -> TimelineEventPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            existing = await _get_owned_event_row(conn, user_id, event_id)

            subject_name = (
                _normalize_subject_name(payload.subject_name)
                if "subject_name" in payload.model_fields_set
                else existing["subject_name"]
            )
            description = (
                payload.description.strip()
                if payload.description is not None
                else existing["description"]
            )
            start_date = (
                payload.start_date
                if payload.start_date is not None
                else existing["start_date"]
            )
            end_date = (
                payload.end_date
                if "end_date" in payload.model_fields_set
                else existing["end_date"]
            )
            all_day = (
                payload.all_day
                if payload.all_day is not None
                else bool(existing["all_day"])
            )

            _validate_date_range(start_date, end_date)

            start_date_changed = (
                payload.start_date is not None
                and payload.start_date != existing["start_date"]
            )

            row = await repository.update_event(
                conn,
                event_id,
                subject_name=subject_name,
                description=description,
                start_date=start_date,
                end_date=end_date,
                all_day=all_day,
            )
            if row is None:
                raise AppError("Timeline event not found.", status_code=404)

            if payload.contact_ids is not None:
                contact_ids = await _resolve_contact_ids(conn, user_id, payload.contact_ids)
                await repository.replace_event_contacts(conn, event_id, contact_ids)

            if payload.figure_ids is not None:
                figure_ids = await _resolve_figure_ids(conn, user_id, payload.figure_ids)
                await repository.replace_event_figures(conn, event_id, figure_ids)

            if payload.tag_ids is not None:
                tag_ids = await _validate_timeline_tag_ids(
                    conn,
                    user_id=user_id,
                    tag_ids=payload.tag_ids,
                )
                await repository.replace_event_tags(
                    conn,
                    event_id=event_id,
                    tag_ids=tag_ids,
                )

            if payload.reminders is not None:
                reminder_rows = _validate_reminders(payload.reminders, start_date=start_date)
                await repository.replace_reminders_for_event(conn, event_id, reminder_rows)
            elif start_date_changed:
                await repository.reset_reminder_sent_at_for_event(conn, event_id)

            contacts_by_event = await repository.list_contacts_for_events(conn, [event_id])
            figures_by_event = await repository.list_figures_for_events(conn, [event_id])
            tags_by_event = await _tags_for_event_rows(conn, [row])
            reminders_by_event = await _reminders_for_event_rows(conn, [row])
            return _record_to_event(
                row,
                contacts=_map_contact_rows(contacts_by_event.get(event_id, [])),
                figures=_map_figure_rows(figures_by_event.get(event_id, [])),
                tags=tags_by_event.get(event_id, []),
                reminders=reminders_by_event.get(event_id, []),
            )


async def delete_event(user_id: int, event_id: int) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_event_row(conn, user_id, event_id)
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.TIMELINE_EVENT,
        str(event_id),
    )
