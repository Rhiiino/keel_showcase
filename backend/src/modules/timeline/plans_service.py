# keel_api/src/modules/timeline/plans_service.py

"""Business logic for timeline plans and plan items."""

from __future__ import annotations

from datetime import date, datetime, time, timezone

import asyncpg

from core.database import get_pool
from core.errors import AppError
from modules.timeline import repository
from modules.timeline.schemas import (
    TimelinePlanCreate,
    TimelinePlanDetailPublic,
    TimelinePlanItemCreate,
    TimelinePlanItemLinkEvent,
    TimelinePlanItemPublic,
    TimelinePlanItemReorder,
    TimelinePlanItemUpdate,
    TimelinePlanPublic,
    TimelinePlanUpdate,
    TimelineTagPublic,
)
from modules.timeline.service import (
    _record_to_tag,
    _validate_timeline_tag_ids,
)



# ----- Record mappers
def _record_to_plan(row: asyncpg.Record) -> TimelinePlanPublic:
    return TimelinePlanPublic(
        id=row["id"],
        user_id=row["user_id"],
        title=row["title"],
        start_date=row["start_date"],
        end_date=row["end_date"],
        notes=row["notes"],
        item_count=int(row.get("item_count", 0)),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _record_to_plan_item(
    row: asyncpg.Record,
    *,
    tags: list[TimelineTagPublic] | None = None,
) -> TimelinePlanItemPublic:
    return TimelinePlanItemPublic(
        id=row["id"],
        user_id=row["user_id"],
        plan_id=row["plan_id"],
        title=row["title"],
        description=row["description"],
        start_at=row["start_at"],
        end_at=row["end_at"],
        all_day=bool(row["all_day"]),
        sort_order=int(row["sort_order"]),
        status=row["status"],
        timeline_event_id=row["timeline_event_id"],
        tags=tags or [],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )



# ----- Validation helpers
def _normalize_plan_title(title: str) -> str:
    normalized = title.strip()
    if not normalized:
        raise AppError("Plan title is required.", status_code=400)
    if len(normalized) > 256:
        raise AppError("Plan title must be at most 256 characters.", status_code=400)
    return normalized


def _normalize_plan_notes(notes: str | None) -> str:
    if notes is None:
        return ""
    return notes.strip()


def _validate_plan_date_range(start_date: date, end_date: date) -> None:
    if end_date < start_date:
        raise AppError("End date must be on or after start date.", status_code=400)


def _normalize_item_title(title: str) -> str:
    normalized = title.strip()
    if not normalized:
        raise AppError("Plan item title is required.", status_code=400)
    if len(normalized) > 256:
        raise AppError("Plan item title must be at most 256 characters.", status_code=400)
    return normalized


def _normalize_item_description(description: str | None) -> str:
    if description is None:
        return ""
    return description.strip()


def _promoted_event_description(title: str, description: str) -> str:
    headline = f"-{title.strip()}"
    body = _normalize_item_description(description)
    if body:
        return f"{headline}\n{body}"
    return headline


def _validate_item_within_plan(
    *,
    plan_start: date,
    plan_end: date,
    start_at: datetime,
    end_at: datetime | None,
) -> None:
    item_start_date = start_at.date()
    if item_start_date < plan_start or item_start_date > plan_end:
        raise AppError("Plan item start must fall within the plan date range.", status_code=400)
    if end_at is not None and end_at < start_at:
        raise AppError("End must be on or after start.", status_code=400)


async def _get_owned_plan_row(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    plan_id: int,
) -> asyncpg.Record:
    row = await repository.get_plan(conn, user_id=user_id, plan_id=plan_id)
    if row is None:
        raise AppError("Timeline plan not found.", status_code=404)
    return row


async def _get_owned_plan_item_row(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    item_id: int,
) -> asyncpg.Record:
    row = await repository.get_plan_item(conn, user_id=user_id, item_id=item_id)
    if row is None:
        raise AppError("Timeline plan item not found.", status_code=404)
    return row


async def _tags_for_plan_item_rows(
    conn: asyncpg.Connection,
    rows: list[asyncpg.Record],
) -> dict[int, list[TimelineTagPublic]]:
    item_ids = [row["id"] for row in rows]
    grouped = await repository.fetch_tags_for_plan_items(conn, item_ids)
    return {
        item_id: [_record_to_tag(tag_row) for tag_row in tag_rows]
        for item_id, tag_rows in grouped.items()
    }


async def _hydrate_plan_items(
    conn: asyncpg.Connection,
    rows: list[asyncpg.Record],
) -> list[TimelinePlanItemPublic]:
    if not rows:
        return []
    tags_by_item = await _tags_for_plan_item_rows(conn, rows)
    return [
        _record_to_plan_item(row, tags=tags_by_item.get(row["id"], []))
        for row in rows
    ]



# ----- Timeline plans
async def list_plans(
    user_id: int,
    *,
    start_date_from: date | None = None,
    start_date_to: date | None = None,
) -> list[TimelinePlanPublic]:
    if (
        start_date_from is not None
        and start_date_to is not None
        and start_date_from > start_date_to
    ):
        raise AppError(
            "start_date_from must be on or before start_date_to.",
            status_code=400,
        )

    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_plans(
            conn,
            user_id,
            start_date_from=start_date_from,
            start_date_to=start_date_to,
        )
    return [_record_to_plan(row) for row in rows]


async def create_plan(user_id: int, payload: TimelinePlanCreate) -> TimelinePlanPublic:
    title = _normalize_plan_title(payload.title)
    notes = _normalize_plan_notes(payload.notes)
    _validate_plan_date_range(payload.start_date, payload.end_date)

    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.insert_plan(
            conn,
            user_id=user_id,
            title=title,
            start_date=payload.start_date,
            end_date=payload.end_date,
            notes=notes,
        )
    return _record_to_plan(row)


async def get_plan_detail(user_id: int, plan_id: int) -> TimelinePlanDetailPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        plan_row = await _get_owned_plan_row(conn, user_id=user_id, plan_id=plan_id)
        item_rows = await repository.list_plan_items_for_plan(
            conn,
            user_id=user_id,
            plan_id=plan_id,
        )
        items = await _hydrate_plan_items(conn, item_rows)
    plan = _record_to_plan(plan_row)
    return TimelinePlanDetailPublic(
        **{**plan.model_dump(), "item_count": len(items)},
        items=items,
    )


async def update_plan(
    user_id: int,
    plan_id: int,
    payload: TimelinePlanUpdate,
) -> TimelinePlanPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await _get_owned_plan_row(conn, user_id=user_id, plan_id=plan_id)
        title = (
            _normalize_plan_title(payload.title)
            if payload.title is not None
            else existing["title"]
        )
        start_date = (
            payload.start_date if payload.start_date is not None else existing["start_date"]
        )
        end_date = (
            payload.end_date if payload.end_date is not None else existing["end_date"]
        )
        notes = (
            _normalize_plan_notes(payload.notes)
            if payload.notes is not None
            else existing["notes"]
        )
        _validate_plan_date_range(start_date, end_date)

        row = await repository.update_plan(
            conn,
            user_id=user_id,
            plan_id=plan_id,
            title=title,
            start_date=start_date,
            end_date=end_date,
            notes=notes,
        )
        if row is None:
            raise AppError("Timeline plan not found.", status_code=404)
    return _record_to_plan(row)


async def delete_plan(user_id: int, plan_id: int) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        deleted = await repository.delete_plan(conn, user_id=user_id, plan_id=plan_id)
        if not deleted:
            raise AppError("Timeline plan not found.", status_code=404)



# ----- Timeline plan items
async def create_plan_item(
    user_id: int,
    plan_id: int,
    payload: TimelinePlanItemCreate,
) -> TimelinePlanItemPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            plan_row = await _get_owned_plan_row(conn, user_id=user_id, plan_id=plan_id)
            title = _normalize_item_title(payload.title)
            description = _normalize_item_description(payload.description)
            _validate_item_within_plan(
                plan_start=plan_row["start_date"],
                plan_end=plan_row["end_date"],
                start_at=payload.start_at,
                end_at=payload.end_at,
            )
            tag_ids = await _validate_timeline_tag_ids(
                conn,
                user_id=user_id,
                tag_ids=payload.tag_ids,
            )
            sort_order = payload.sort_order
            if sort_order is None:
                sort_order = await repository.max_sort_order_for_plan(
                    conn,
                    user_id=user_id,
                    plan_id=plan_id,
                ) + 1

            row = await repository.insert_plan_item(
                conn,
                user_id=user_id,
                plan_id=plan_id,
                title=title,
                description=description,
                start_at=payload.start_at,
                end_at=payload.end_at,
                all_day=payload.all_day,
                sort_order=sort_order,
                status=payload.status,
            )
            await repository.replace_plan_item_tags(
                conn,
                plan_item_id=row["id"],
                tag_ids=tag_ids,
            )
            tags_by_item = await _tags_for_plan_item_rows(conn, [row])
            return _record_to_plan_item(row, tags=tags_by_item.get(row["id"], []))


async def update_plan_item(
    user_id: int,
    item_id: int,
    payload: TimelinePlanItemUpdate,
) -> TimelinePlanItemPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            existing = await _get_owned_plan_item_row(conn, user_id=user_id, item_id=item_id)
            plan_row = await _get_owned_plan_row(
                conn,
                user_id=user_id,
                plan_id=existing["plan_id"],
            )

            title = (
                _normalize_item_title(payload.title)
                if payload.title is not None
                else existing["title"]
            )
            description = (
                _normalize_item_description(payload.description)
                if payload.description is not None
                else existing["description"]
            )
            start_at = payload.start_at if payload.start_at is not None else existing["start_at"]
            end_at = (
                payload.end_at
                if "end_at" in payload.model_fields_set
                else existing["end_at"]
            )
            all_day = payload.all_day if payload.all_day is not None else bool(existing["all_day"])
            sort_order = (
                payload.sort_order
                if payload.sort_order is not None
                else int(existing["sort_order"])
            )
            status = payload.status if payload.status is not None else existing["status"]
            timeline_event_id = existing["timeline_event_id"]

            _validate_item_within_plan(
                plan_start=plan_row["start_date"],
                plan_end=plan_row["end_date"],
                start_at=start_at,
                end_at=end_at,
            )

            row = await repository.update_plan_item(
                conn,
                user_id=user_id,
                item_id=item_id,
                title=title,
                description=description,
                start_at=start_at,
                end_at=end_at,
                all_day=all_day,
                sort_order=sort_order,
                status=status,
                timeline_event_id=timeline_event_id,
            )
            if row is None:
                raise AppError("Timeline plan item not found.", status_code=404)

            if payload.tag_ids is not None:
                tag_ids = await _validate_timeline_tag_ids(
                    conn,
                    user_id=user_id,
                    tag_ids=payload.tag_ids,
                )
                await repository.replace_plan_item_tags(
                    conn,
                    plan_item_id=item_id,
                    tag_ids=tag_ids,
                )

            tags_by_item = await _tags_for_plan_item_rows(conn, [row])
            return _record_to_plan_item(row, tags=tags_by_item.get(row["id"], []))


async def delete_plan_item(user_id: int, item_id: int) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        deleted = await repository.delete_plan_item(conn, user_id=user_id, item_id=item_id)
        if not deleted:
            raise AppError("Timeline plan item not found.", status_code=404)


async def reorder_plan_item(
    user_id: int,
    item_id: int,
    payload: TimelinePlanItemReorder,
) -> TimelinePlanItemPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            existing = await _get_owned_plan_item_row(
                conn,
                user_id=user_id,
                item_id=item_id,
            )
            plan_id = int(existing["plan_id"])
            item_rows = await repository.list_plan_items_for_plan(
                conn,
                user_id=user_id,
                plan_id=plan_id,
            )
            item_ids = [int(row["id"]) for row in item_rows]
            if item_id not in item_ids:
                raise AppError("Timeline plan item not found.", status_code=404)

            next_ids = [current_id for current_id in item_ids if current_id != item_id]
            target_index = max(0, min(payload.sort_order, len(next_ids)))
            next_ids.insert(target_index, item_id)

            if next_ids == item_ids:
                tags_by_item = await _tags_for_plan_item_rows(conn, [existing])
                return _record_to_plan_item(
                    existing,
                    tags=tags_by_item.get(item_id, []),
                )

            sort_orders_by_item_id: dict[int, int] = {}
            row_by_id = {int(row["id"]): row for row in item_rows}
            for index, current_id in enumerate(next_ids):
                current_sort_order = int(row_by_id[current_id]["sort_order"])
                if current_sort_order != index:
                    sort_orders_by_item_id[current_id] = index

            if sort_orders_by_item_id:
                await repository.update_plan_item_sort_orders(
                    conn,
                    user_id=user_id,
                    plan_id=plan_id,
                    sort_orders_by_item_id=sort_orders_by_item_id,
                )

            row = await repository.get_plan_item(
                conn,
                user_id=user_id,
                item_id=item_id,
            )
            if row is None:
                raise AppError("Timeline plan item not found.", status_code=404)
            tags_by_item = await _tags_for_plan_item_rows(conn, [row])
            return _record_to_plan_item(row, tags=tags_by_item.get(item_id, []))


async def promote_plan_item(user_id: int, item_id: int) -> TimelinePlanItemPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            existing = await _get_owned_plan_item_row(conn, user_id=user_id, item_id=item_id)
            if existing["timeline_event_id"] is not None:
                raise AppError("Plan item is already linked to a timeline event.", status_code=400)

            tags_by_item = await _tags_for_plan_item_rows(conn, [existing])
            tag_ids = [tag.id for tag in tags_by_item.get(item_id, [])]

            start_at: datetime = existing["start_at"]
            end_at: datetime | None = existing["end_at"]
            event_all_day = bool(existing["all_day"])
            if event_all_day:
                start_at = datetime.combine(
                    start_at.date(),
                    time.min,
                    tzinfo=start_at.tzinfo or timezone.utc,
                )
                if end_at is not None:
                    end_at = datetime.combine(
                        end_at.date(),
                        time.min,
                        tzinfo=end_at.tzinfo or timezone.utc,
                    )

            event_row = await repository.insert_event(
                conn,
                user_id=user_id,
                subject_name=None,
                description=_promoted_event_description(
                    existing["title"],
                    existing["description"],
                ),
                start_date=start_at,
                end_date=end_at,
                all_day=event_all_day,
            )
            await repository.replace_event_tags(
                conn,
                event_id=event_row["id"],
                tag_ids=tag_ids,
            )

            row = await repository.update_plan_item(
                conn,
                user_id=user_id,
                item_id=item_id,
                title=existing["title"],
                description=existing["description"],
                start_at=existing["start_at"],
                end_at=existing["end_at"],
                all_day=bool(existing["all_day"]),
                sort_order=int(existing["sort_order"]),
                status=existing["status"],
                timeline_event_id=event_row["id"],
            )
            if row is None:
                raise AppError("Timeline plan item not found.", status_code=404)

            refreshed_tags = await _tags_for_plan_item_rows(conn, [row])
            return _record_to_plan_item(row, tags=refreshed_tags.get(row["id"], []))


async def link_plan_item_event(
    user_id: int,
    item_id: int,
    payload: TimelinePlanItemLinkEvent,
) -> TimelinePlanItemPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            existing = await _get_owned_plan_item_row(conn, user_id=user_id, item_id=item_id)
            event_row = await repository.get_event(conn, payload.timeline_event_id)
            if event_row is None or event_row["user_id"] != user_id:
                raise AppError("Timeline event not found.", status_code=404)

            row = await repository.update_plan_item(
                conn,
                user_id=user_id,
                item_id=item_id,
                title=existing["title"],
                description=existing["description"],
                start_at=existing["start_at"],
                end_at=existing["end_at"],
                all_day=bool(existing["all_day"]),
                sort_order=int(existing["sort_order"]),
                status=existing["status"],
                timeline_event_id=payload.timeline_event_id,
            )
            if row is None:
                raise AppError("Timeline plan item not found.", status_code=404)

            tags_by_item = await _tags_for_plan_item_rows(conn, [row])
            return _record_to_plan_item(row, tags=tags_by_item.get(row["id"], []))


async def list_plan_items_in_range(
    user_id: int,
    *,
    start_at_from: datetime,
    start_at_to: datetime,
) -> list[TimelinePlanItemPublic]:
    if start_at_from > start_at_to:
        raise AppError("start must be on or before end.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_plan_items_in_range(
            conn,
            user_id,
            start_at_from=start_at_from,
            start_at_to=start_at_to,
        )
        return await _hydrate_plan_items(conn, rows)
