# keel_api/src/modules/deleted/handlers/focus.py
"""Trash handlers for focus module entities."""

from __future__ import annotations

from core.errors import AppError
from core.tables import (
    FOCUS_NODE_TAGS,
    FOCUS_NODE_TIME_ENTRIES,
    FOCUS_NODES,
    FOCUS_TAGS,
)
from modules.deleted import entity_types
from modules.deleted.handlers._protocol import CaptureResult, DeletedEntityHandler
from modules.deleted.handlers._utils import (
    build_label,
    fetch_row,
    record_to_dict,
    restore_table_rows,
)
from modules.focus.repository import nodes as nodes_repository
from modules.focus.repository import tags as tags_repository


async def _list_focus_subtree(
    conn,
    *,
    user_id: int,
    node_id: int,
) -> list:
    return await conn.fetch(
        f"""
        WITH RECURSIVE subtree AS (
            SELECT *
            FROM {FOCUS_NODES}
            WHERE id = $1 AND user_id = $2
            UNION ALL
            SELECT child.*
            FROM {FOCUS_NODES} child
            INNER JOIN subtree parent ON child.parent_id = parent.id
            WHERE child.user_id = $2
        )
        SELECT * FROM subtree
        ORDER BY parent_id NULLS FIRST, sort_order, id
        """,
        node_id,
        user_id,
    )


class FocusNodeHandler:
    entity_type = entity_types.FOCUS_NODE

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        node_id = int(entity_id)
        nodes = await _list_focus_subtree(conn, user_id=user_id, node_id=node_id)
        if not nodes:
            raise AppError("Focus node not found.", status_code=404)
        node_ids = [row["id"] for row in nodes]
        tag_rows = await conn.fetch(
            f"""
            SELECT * FROM {FOCUS_NODE_TAGS}
            WHERE node_id = ANY($1::int[])
            ORDER BY node_id, tag_id
            """,
            node_ids,
        )
        time_entries = await conn.fetch(
            f"""
            SELECT * FROM {FOCUS_NODE_TIME_ENTRIES}
            WHERE user_id = $1 AND node_id = ANY($2::int[])
            ORDER BY id
            """,
            user_id,
            node_ids,
        )
        root = nodes[0]
        return CaptureResult(
            display_label=build_label(root, "title", fallback=f"Focus node {node_id}"),
            payload={
                "nodes": [record_to_dict(row) for row in nodes],
                "node_tags": [record_to_dict(row) for row in tag_rows],
                "time_entries": [record_to_dict(row) for row in time_entries],
            },
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        deleted = await nodes_repository.delete_focus_node(
            conn,
            user_id=user_id,
            node_id=int(entity_id),
        )
        if not deleted:
            raise AppError("Focus node not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        nodes = payload.get("nodes", [])
        await restore_table_rows(conn, FOCUS_NODES, nodes)
        await restore_table_rows(conn, FOCUS_NODE_TAGS, payload.get("node_tags", []))
        await restore_table_rows(conn, FOCUS_NODE_TIME_ENTRIES, payload.get("time_entries", []))
        return str(nodes[0]["id"]) if nodes else ""

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class FocusTagHandler:
    entity_type = entity_types.FOCUS_TAG

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        tag_id = int(entity_id)
        row = await tags_repository.get_user_tag(conn, user_id=user_id, tag_id=tag_id)
        if row is None:
            raise AppError("Tag not found.", status_code=404)
        return CaptureResult(
            display_label=row["name"],
            payload={"tag": record_to_dict(row)},
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        deleted = await tags_repository.delete_user_tag(
            conn,
            user_id=user_id,
            tag_id=int(entity_id),
        )
        if not deleted:
            raise AppError("Tag not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, FOCUS_TAGS, [payload["tag"]])
        return str(payload["tag"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


HANDLERS: tuple[DeletedEntityHandler, ...] = (
    FocusNodeHandler(),
    FocusTagHandler(),
)
