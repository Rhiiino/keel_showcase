# keel_api/src/modules/media/panel_service.py

"""Business logic for media display panels."""

from __future__ import annotations

from uuid import UUID, uuid4

import asyncpg
from asyncpg.exceptions import UniqueViolationError

from core.database import get_pool
from core.errors import AppError
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.media import config, panel_grid, repository
from modules.media.schemas import (
    MediaPanelCreate,
    MediaPanelDetailPublic,
    MediaPanelItemCreate,
    MediaPanelItemPublic,
    MediaPanelItemSwap,
    MediaPanelItemUpdate,
    MediaPanelLayoutUpdate,
    MediaPanelPublic,
    MediaPanelUpdate,
    MediaPublic,
)
from modules.media.service import _record_to_media


def _record_to_panel(row: asyncpg.Record) -> MediaPanelPublic:
    """Map a panel list row to MediaPanelPublic."""
    return MediaPanelPublic(
        id=row["id"],
        user_id=row["user_id"],
        name=row["name"],
        column_count=row["column_count"],
        row_unit_px=row["row_unit_px"],
        sort_order=row["sort_order"],
        item_count=row.get("item_count", 0),
        preview_media_id=row.get("preview_media_id"),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _record_to_panel_item(
    row: asyncpg.Record,
    media_row: asyncpg.Record,
) -> MediaPanelItemPublic:
    """Map panel item + media rows to MediaPanelItemPublic."""
    return MediaPanelItemPublic(
        id=row["id"],
        panel_id=row["panel_id"],
        media_id=row["media_id"],
        grid_x=row["grid_x"],
        grid_y=row["grid_y"],
        col_span=row["col_span"],
        row_span=row["row_span"],
        preview_scale=float(row["preview_scale"]),
        preview_focal_x=float(row["preview_focal_x"]),
        preview_focal_y=float(row["preview_focal_y"]),
        border_color=row.get("border_color"),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        media=_record_to_media(media_row),
    )


async def _assert_owned_panel(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    panel_id: UUID,
) -> asyncpg.Record:
    """Return a panel row or raise 404."""
    row = await repository.get_media_panel_for_user(conn, panel_id, user_id)
    if row is None:
        raise AppError("Panel not found.", status_code=404)
    return row


async def _load_panel_detail(
    conn: asyncpg.Connection,
    panel_row: asyncpg.Record,
) -> MediaPanelDetailPublic:
    """Build a panel detail response with nested media."""
    item_rows = await repository.list_media_panel_items(conn, panel_id=panel_row["id"])
    items: list[MediaPanelItemPublic] = []
    for item_row in item_rows:
        media_row = await repository.get_media_object_for_user(
            conn,
            item_row["media_id"],
            panel_row["user_id"],
        )
        if media_row is None or media_row["status"] != "ready":
            continue
        items.append(_record_to_panel_item(item_row, media_row))
    return MediaPanelDetailPublic(
        id=panel_row["id"],
        user_id=panel_row["user_id"],
        name=panel_row["name"],
        column_count=panel_row["column_count"],
        row_unit_px=panel_row["row_unit_px"],
        sort_order=panel_row["sort_order"],
        created_at=panel_row["created_at"],
        updated_at=panel_row["updated_at"],
        items=items,
    )


async def list_panels(user_id: int) -> list[MediaPanelPublic]:
    """List all panels for the current user."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_media_panels_for_user(conn, user_id)
    return [_record_to_panel(row) for row in rows]


async def create_panel(user_id: int, payload: MediaPanelCreate) -> MediaPanelPublic:
    """Create an empty display panel."""
    name = payload.name.strip()
    if not name:
        raise AppError("Panel name is required.", status_code=400)
    if len(name) > config.MAX_PANEL_NAME_LENGTH:
        raise AppError("Panel name is too long.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.insert_media_panel(
            conn,
            panel_id=uuid4(),
            user_id=user_id,
            name=name,
            column_count=config.DEFAULT_PANEL_COLUMN_COUNT,
            row_unit_px=config.DEFAULT_PANEL_ROW_UNIT_PX,
        )
    return _record_to_panel({**dict(row), "item_count": 0, "preview_media_id": None})


async def get_panel(user_id: int, panel_id: UUID) -> MediaPanelDetailPublic:
    """Fetch one panel with all items."""
    pool = get_pool()
    async with pool.acquire() as conn:
        panel_row = await _assert_owned_panel(conn, user_id=user_id, panel_id=panel_id)
        return await _load_panel_detail(conn, panel_row)


async def update_panel(
    user_id: int,
    panel_id: UUID,
    payload: MediaPanelUpdate,
) -> MediaPanelPublic:
    """Rename a panel."""
    if payload.name is None:
        raise AppError("Nothing to update.", status_code=400)
    name = payload.name.strip()
    if not name:
        raise AppError("Panel name is required.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await _assert_owned_panel(conn, user_id=user_id, panel_id=panel_id)
            row = await repository.update_media_panel_name(
                conn,
                panel_id=panel_id,
                name=name,
            )
            if row is None:
                raise AppError("Failed to update panel.", status_code=500)
            item_rows = await repository.list_media_panel_items(conn, panel_id=panel_id)
    return _record_to_panel(
        {
            **dict(row),
            "item_count": len(item_rows),
            "preview_media_id": item_rows[0]["media_id"] if item_rows else None,
        }
    )


async def delete_panel(user_id: int, panel_id: UUID) -> None:
    """Delete a panel via recently-deleted trash."""
    pool = get_pool()
    async with pool.acquire() as conn:
        await _assert_owned_panel(conn, user_id=user_id, panel_id=panel_id)
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.MEDIA_PANEL,
        str(panel_id),
    )


async def add_panel_item(
    user_id: int,
    panel_id: UUID,
    payload: MediaPanelItemCreate,
) -> MediaPanelItemPublic:
    """Add one media tile to a panel."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            panel_row = await _assert_owned_panel(conn, user_id=user_id, panel_id=panel_id)
            media_row = await repository.get_media_object_for_user(
                conn,
                payload.media_id,
                user_id,
            )
            if media_row is None or media_row["status"] != "ready":
                raise AppError("Media not found.", status_code=404)

            existing_rows = await repository.list_media_panel_items(conn, panel_id=panel_id)
            existing = panel_grid.placements_from_records(existing_rows)

            if payload.layout_updates:
                updates_by_id = {str(item.id): item for item in payload.layout_updates}
                existing_ids = {placement.id for placement in existing}
                for update_id in updates_by_id:
                    if update_id not in existing_ids:
                        raise AppError("Layout update item not found.", status_code=400)
                existing = [
                    panel_grid.PanelPlacement(
                        id=placement.id,
                        grid_x=updates_by_id[placement.id].grid_x
                        if placement.id in updates_by_id
                        else placement.grid_x,
                        grid_y=updates_by_id[placement.id].grid_y
                        if placement.id in updates_by_id
                        else placement.grid_y,
                        col_span=updates_by_id[placement.id].col_span
                        if placement.id in updates_by_id
                        else placement.col_span,
                        row_span=updates_by_id[placement.id].row_span
                        if placement.id in updates_by_id
                        else placement.row_span,
                    )
                    for placement in existing
                ]

            if payload.grid_x is not None and payload.grid_y is not None:
                placement = panel_grid.PanelPlacement(
                    id="",
                    grid_x=payload.grid_x,
                    grid_y=payload.grid_y,
                    col_span=payload.col_span or 1,
                    row_span=payload.row_span or 1,
                )
            else:
                placement = panel_grid.placement_for_new_item(
                    existing,
                    panel_row["column_count"],
                    col_span=payload.col_span or panel_row["column_count"],
                    row_span=payload.row_span or panel_grid.DEFAULT_APPEND_ROW_SPAN,
                )

            panel_grid.assert_fits_container(placement, panel_row["column_count"])
            trial = existing + [
                panel_grid.PanelPlacement(
                    id="new",
                    grid_x=placement.grid_x,
                    grid_y=placement.grid_y,
                    col_span=placement.col_span,
                    row_span=placement.row_span,
                )
            ]
            panel_grid.assert_packed_layout(trial, panel_row["column_count"])

            if payload.layout_updates:
                for update in payload.layout_updates:
                    updated = await repository.update_media_panel_item_layout(
                        conn,
                        item_id=update.id,
                        grid_x=update.grid_x,
                        grid_y=update.grid_y,
                        col_span=update.col_span,
                        row_span=update.row_span,
                    )
                    if updated is None:
                        raise AppError("Failed to update panel item.", status_code=500)

            try:
                item_row = await repository.insert_media_panel_item(
                    conn,
                    item_id=uuid4(),
                    panel_id=panel_id,
                    media_id=payload.media_id,
                    grid_x=placement.grid_x,
                    grid_y=placement.grid_y,
                    col_span=placement.col_span,
                    row_span=placement.row_span,
                )
            except UniqueViolationError as exc:
                raise AppError("Media is already on this panel.", status_code=409) from exc
            await repository.touch_media_panel(conn, panel_id=panel_id)

    return _record_to_panel_item(item_row, media_row)


async def update_panel_item(
    user_id: int,
    panel_id: UUID,
    item_id: UUID,
    payload: MediaPanelItemUpdate,
) -> MediaPanelItemPublic:
    """Update one tile placement."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            panel_row = await _assert_owned_panel(conn, user_id=user_id, panel_id=panel_id)
            item_row = await repository.get_media_panel_item(
                conn,
                panel_id=panel_id,
                item_id=item_id,
            )
            if item_row is None:
                raise AppError("Panel item not found.", status_code=404)

            placement = panel_grid.PanelPlacement(
                id=str(item_id),
                grid_x=payload.grid_x if payload.grid_x is not None else item_row["grid_x"],
                grid_y=payload.grid_y if payload.grid_y is not None else item_row["grid_y"],
                col_span=payload.col_span if payload.col_span is not None else item_row["col_span"],
                row_span=payload.row_span if payload.row_span is not None else item_row["row_span"],
            )
            preview_scale = (
                payload.preview_scale
                if payload.preview_scale is not None
                else float(item_row["preview_scale"])
            )
            preview_focal_x = (
                payload.preview_focal_x
                if payload.preview_focal_x is not None
                else float(item_row["preview_focal_x"])
            )
            preview_focal_y = (
                payload.preview_focal_y
                if payload.preview_focal_y is not None
                else float(item_row["preview_focal_y"])
            )
            border_color = item_row.get("border_color")
            if "border_color" in payload.model_fields_set:
                border_color = payload.border_color
            others = [
                panel_grid.PanelPlacement(
                    id=str(row["id"]),
                    grid_x=row["grid_x"],
                    grid_y=row["grid_y"],
                    col_span=row["col_span"],
                    row_span=row["row_span"],
                )
                for row in await repository.list_media_panel_items(conn, panel_id=panel_id)
                if row["id"] != item_id
            ]
            panel_grid.assert_packed_layout(
                others + [placement],
                panel_row["column_count"],
            )

            updated = await repository.update_media_panel_item(
                conn,
                item_id=item_id,
                grid_x=placement.grid_x,
                grid_y=placement.grid_y,
                col_span=placement.col_span,
                row_span=placement.row_span,
                preview_scale=preview_scale,
                preview_focal_x=preview_focal_x,
                preview_focal_y=preview_focal_y,
                border_color=border_color,
            )
            if updated is None:
                raise AppError("Failed to update panel item.", status_code=500)
            await repository.touch_media_panel(conn, panel_id=panel_id)
            media_row = await repository.get_media_object_for_user(
                conn,
                updated["media_id"],
                user_id,
            )
            if media_row is None:
                raise AppError("Media not found.", status_code=404)

    return _record_to_panel_item(updated, media_row)


async def replace_panel_layout(
    user_id: int,
    panel_id: UUID,
    payload: MediaPanelLayoutUpdate,
) -> MediaPanelDetailPublic:
    """Batch-update all tile placements after reflow."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            panel_row = await _assert_owned_panel(conn, user_id=user_id, panel_id=panel_id)
            existing_rows = await repository.list_media_panel_items(conn, panel_id=panel_id)
            existing_ids = {row["id"] for row in existing_rows}
            payload_ids = {item.id for item in payload.items}
            if existing_ids != payload_ids:
                raise AppError("Layout must include every panel item.", status_code=400)

            placements = [
                panel_grid.PanelPlacement(
                    id=str(item.id),
                    grid_x=item.grid_x,
                    grid_y=item.grid_y,
                    col_span=item.col_span,
                    row_span=item.row_span,
                )
                for item in payload.items
            ]
            panel_grid.assert_packed_layout(placements, panel_row["column_count"])

            await repository.replace_media_panel_layout(
                conn,
                panel_id=panel_id,
                placements=[
                    (item.id, item.grid_x, item.grid_y, item.col_span, item.row_span)
                    for item in payload.items
                ],
            )
            refreshed = await repository.get_media_panel_for_user(conn, panel_id, user_id)
            if refreshed is None:
                raise AppError("Panel not found.", status_code=404)
            return await _load_panel_detail(conn, refreshed)


async def swap_panel_items(
    user_id: int,
    panel_id: UUID,
    payload: MediaPanelItemSwap,
) -> MediaPanelDetailPublic:
    """Swap grid placements between two tiles."""
    if payload.item_a_id == payload.item_b_id:
        raise AppError("Cannot swap a tile with itself.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            panel_row = await _assert_owned_panel(conn, user_id=user_id, panel_id=panel_id)
            item_a = await repository.get_media_panel_item(
                conn,
                panel_id=panel_id,
                item_id=payload.item_a_id,
            )
            item_b = await repository.get_media_panel_item(
                conn,
                panel_id=panel_id,
                item_id=payload.item_b_id,
            )
            if item_a is None or item_b is None:
                raise AppError("Panel item not found.", status_code=404)

            await repository.swap_media_panel_item_placements(
                conn,
                item_a_id=payload.item_a_id,
                item_b_id=payload.item_b_id,
            )

            placements = [
                panel_grid.PanelPlacement(
                    id=str(row["id"]),
                    grid_x=row["grid_x"],
                    grid_y=row["grid_y"],
                    col_span=row["col_span"],
                    row_span=row["row_span"],
                )
                for row in await repository.list_media_panel_items(conn, panel_id=panel_id)
            ]
            panel_grid.assert_packed_layout(placements, panel_row["column_count"])
            await repository.touch_media_panel(conn, panel_id=panel_id)
            refreshed = await repository.get_media_panel_for_user(conn, panel_id, user_id)
            if refreshed is None:
                raise AppError("Panel not found.", status_code=404)
            return await _load_panel_detail(conn, refreshed)


async def remove_panel_item(user_id: int, panel_id: UUID, item_id: UUID) -> MediaPanelDetailPublic:
    """Remove one tile and compact neighbors when possible."""
    pool = get_pool()
    async with pool.acquire() as conn:
        panel_row = await _assert_owned_panel(conn, user_id=user_id, panel_id=panel_id)
        item_row = await repository.get_media_panel_item(
            conn,
            panel_id=panel_id,
            item_id=item_id,
        )
        if item_row is None:
            raise AppError("Panel item not found.", status_code=404)

        removed = panel_grid.PanelPlacement(
            id=str(item_id),
            grid_x=item_row["grid_x"],
            grid_y=item_row["grid_y"],
            col_span=item_row["col_span"],
            row_span=item_row["row_span"],
        )
        remaining_rows = [
            row
            for row in await repository.list_media_panel_items(conn, panel_id=panel_id)
            if row["id"] != item_id
        ]
        column_count = panel_row["column_count"]

    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.MEDIA_PANEL_ITEM,
        str(item_id),
    )

    async with pool.acquire() as conn:
        async with conn.transaction():
            if remaining_rows:
                remaining = panel_grid.placements_from_records(remaining_rows)
                compacted = panel_grid.compact_after_remove(
                    remaining,
                    removed,
                    column_count,
                )
                panel_grid.assert_packed_layout(compacted, column_count)
                await repository.replace_media_panel_layout(
                    conn,
                    panel_id=panel_id,
                    placements=[
                        (
                            UUID(item.id),
                            item.grid_x,
                            item.grid_y,
                            item.col_span,
                            item.row_span,
                        )
                        for item in compacted
                    ],
                )

            await repository.touch_media_panel(conn, panel_id=panel_id)
            refreshed = await repository.get_media_panel_for_user(conn, panel_id, user_id)
            if refreshed is None:
                raise AppError("Panel not found.", status_code=404)
            return await _load_panel_detail(conn, refreshed)
