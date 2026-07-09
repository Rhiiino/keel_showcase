# keel_api/src/modules/deleted/handlers/figures.py
"""Trash handlers for figures module entities."""

from __future__ import annotations

from core.errors import AppError
from core.tables import FIGURES, MEDIA_ATTACHMENTS
from modules.deleted import entity_types
from modules.deleted.handlers._protocol import CaptureResult, DeletedEntityHandler
from modules.deleted.handlers._utils import (
    build_label,
    delete_rows,
    fetch_rows,
    record_to_dict,
    restore_table_rows,
)
from modules.figures import repository


class FigureHandler:
    entity_type = entity_types.FIGURE

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        figure_id = int(entity_id)
        row = await repository.get_figure_by_id(conn, user_id, figure_id)
        if row is None:
            raise AppError("Figure not found.", status_code=404)
        attachments = await fetch_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'figure' AND entity_id = $1",
            params=(figure_id,),
        )
        label = build_label(row, "first_name", "last_name", fallback=f"Figure {figure_id}")
        return CaptureResult(
            display_label=label,
            payload={
                "figure": record_to_dict(row),
                "attachments": [record_to_dict(r) for r in attachments],
            },
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        figure_id = int(entity_id)
        await delete_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'figure' AND entity_id = $1",
            params=(figure_id,),
        )
        deleted = await repository.delete_figure(conn, user_id, figure_id)
        if not deleted:
            raise AppError("Figure not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, FIGURES, [payload["figure"]])
        await restore_table_rows(conn, MEDIA_ATTACHMENTS, payload.get("attachments", []))
        return str(payload["figure"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


HANDLERS: tuple[DeletedEntityHandler, ...] = (FigureHandler(),)
