# keel_api/src/modules/focus/repository/nodes.py

"""SQL access for focus nodes."""

from __future__ import annotations

import asyncpg

from core.tables import FOCUS_NODES

_NODE_ROW_COLUMNS = (
    "id, user_id, parent_id, kind, sort_order, title, notes, status, "
    "completed_at, work_order, node_color_hex, title_font_key, is_origin, "
    "reference_target_type, reference_target_id, show_reference_content, "
    "created_at, updated_at"
)

_NODE_ROW_COLUMNS_FN = (
    "fn.id, fn.user_id, fn.parent_id, fn.kind, fn.sort_order, fn.title, fn.notes, "
    "fn.status, fn.completed_at, fn.work_order, fn.node_color_hex, fn.title_font_key, "
    "fn.is_origin, fn.reference_target_type, fn.reference_target_id, "
    "fn.show_reference_content, fn.created_at, fn.updated_at"
)

# Hub grid lists: root lists plus lists linked directly under the origin node.
_HUB_LIST_PARENT_ELIGIBLE = """
(
    fn.parent_id IS NULL
    OR fn.parent_id = (
        SELECT origin.id
        FROM focus_nodes origin
        WHERE origin.user_id = fn.user_id
          AND origin.is_origin = TRUE
        LIMIT 1
    )
)
"""



# ----- Focus nodes
async def list_focus_nodes(
    conn: asyncpg.Connection,
    user_id: int,
    *,
    parent_id: int | None = None,
    parent_id_is_null: bool | None = None,
    kind: str | None = None,
    kinds: list[str] | None = None,
    status: str | None = None,
    node_ids: list[int] | None = None,
    hub_lists_only: bool = False,
) -> list[asyncpg.Record]:
    """List focus node rows with optional filters."""
    conditions = ["fn.user_id = $1"]
    params: list[object] = [user_id]

    if parent_id_is_null is True:
        conditions.append("fn.parent_id IS NULL")
    elif parent_id is not None:
        params.append(parent_id)
        conditions.append(f"fn.parent_id = ${len(params)}")

    if kind is not None:
        params.append(kind)
        conditions.append(f"fn.kind = ${len(params)}")
    if kinds is not None:
        params.append(kinds)
        conditions.append(f"fn.kind = ANY(${len(params)}::text[])")

    if status is not None:
        params.append(status)
        conditions.append(f"fn.status = ${len(params)}")

    if node_ids is not None:
        params.append(node_ids)
        conditions.append(f"fn.id = ANY(${len(params)}::int[])")

    if hub_lists_only:
        conditions.append("fn.kind IN ('list', 'record')")
        conditions.append(_HUB_LIST_PARENT_ELIGIBLE)

    where = " AND ".join(conditions)
    order = (
        "fn.sort_order ASC, fn.updated_at DESC, fn.id ASC"
        if hub_lists_only
        else "fn.sort_order ASC, fn.id ASC"
    )

    return await conn.fetch(
        f"""
        SELECT {_NODE_ROW_COLUMNS_FN}
        FROM {FOCUS_NODES} fn
        WHERE {where}
        ORDER BY {order}
        """,
        *params,
    )


async def get_focus_node(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    node_id: int,
) -> asyncpg.Record | None:
    """Fetch one focus node row owned by a user."""
    return await conn.fetchrow(
        f"""
        SELECT {_NODE_ROW_COLUMNS}
        FROM {FOCUS_NODES}
        WHERE id = $1 AND user_id = $2
        """,
        node_id,
        user_id,
    )


async def get_focus_node_kind(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    node_id: int,
) -> str | None:
    """Return the kind for one owned node."""
    return await conn.fetchval(
        f"""
        SELECT kind
        FROM {FOCUS_NODES}
        WHERE id = $1 AND user_id = $2
        """,
        node_id,
        user_id,
    )


async def get_focus_node_parent_id(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    node_id: int,
) -> int | None:
    """Return parent_id for one owned node."""
    return await conn.fetchval(
        f"""
        SELECT parent_id
        FROM {FOCUS_NODES}
        WHERE id = $1 AND user_id = $2
        """,
        node_id,
        user_id,
    )


async def insert_focus_node(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    parent_id: int | None,
    kind: str,
    title: str,
    sort_order: int,
    notes: str = "",
    status: str = "active",
    completed_at: object = None,
    work_order: int | None = None,
    node_color_hex: str | None = None,
    title_font_key: str | None = None,
    is_origin: bool = False,
    reference_target_type: str | None = None,
    reference_target_id: str | None = None,
    show_reference_content: bool = False,
) -> asyncpg.Record:
    """Insert a new focus node row."""
    row = await conn.fetchrow(
        f"""
        INSERT INTO {FOCUS_NODES} (
            user_id, parent_id, kind, sort_order, title, notes, status,
            completed_at, work_order, node_color_hex, title_font_key, is_origin,
            reference_target_type, reference_target_id, show_reference_content
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
        RETURNING {_NODE_ROW_COLUMNS}
        """,
        user_id,
        parent_id,
        kind,
        sort_order,
        title,
        notes,
        status,
        completed_at,
        work_order,
        node_color_hex,
        title_font_key,
        is_origin,
        reference_target_type,
        reference_target_id,
        show_reference_content,
    )
    if row is None:
        raise RuntimeError("Failed to insert focus node.")
    return row


async def update_focus_node(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    node_id: int,
    parent_id: int | None = None,
    update_parent_id: bool = False,
    title: str | None = None,
    sort_order: int | None = None,
    notes: str | None = None,
    status: str | None = None,
    completed_at: object = None,
    update_completed_at: bool = False,
    work_order: int | None = None,
    update_work_order: bool = False,
    node_color_hex: str | None = None,
    update_node_color_hex: bool = False,
    title_font_key: str | None = None,
    update_title_font_key: bool = False,
    is_origin: bool | None = None,
    update_is_origin: bool = False,
    reference_target_type: str | None = None,
    reference_target_id: str | None = None,
    update_reference_target: bool = False,
    show_reference_content: bool | None = None,
    update_show_reference_content: bool = False,
) -> asyncpg.Record | None:
    """Update one focus node row."""
    return await conn.fetchrow(
        f"""
        UPDATE {FOCUS_NODES}
        SET
            parent_id = CASE WHEN $4 THEN $3 ELSE parent_id END,
            title = COALESCE($5, title),
            sort_order = COALESCE($6, sort_order),
            notes = COALESCE($7, notes),
            status = COALESCE($8, status),
            completed_at = CASE WHEN $10 THEN $9 ELSE completed_at END,
            work_order = CASE WHEN $12 THEN $11 ELSE work_order END,
            node_color_hex = CASE WHEN $14 THEN $13 ELSE node_color_hex END,
            title_font_key = CASE WHEN $16 THEN $15 ELSE title_font_key END,
            is_origin = CASE WHEN $18 THEN $17 ELSE is_origin END,
            reference_target_type = CASE
                WHEN $21 THEN $19
                ELSE reference_target_type
            END,
            reference_target_id = CASE
                WHEN $21 THEN $20
                ELSE reference_target_id
            END,
            show_reference_content = CASE
                WHEN $23 THEN $22
                ELSE show_reference_content
            END,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING {_NODE_ROW_COLUMNS}
        """,
        node_id,
        user_id,
        parent_id,
        update_parent_id,
        title,
        sort_order,
        notes,
        status,
        completed_at,
        update_completed_at,
        work_order,
        update_work_order,
        node_color_hex,
        update_node_color_hex,
        title_font_key,
        update_title_font_key,
        is_origin,
        update_is_origin,
        reference_target_type,
        reference_target_id,
        update_reference_target,
        show_reference_content,
        update_show_reference_content,
    )


async def promote_focus_item_to_list(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    node_id: int,
) -> asyncpg.Record | None:
    """Promote one item node into a list node."""
    return await conn.fetchrow(
        f"""
        UPDATE {FOCUS_NODES}
        SET
            kind = 'list',
            completed_at = CASE WHEN status = 'completed' THEN completed_at ELSE NULL END,
            is_origin = FALSE,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND kind = 'item'
        RETURNING {_NODE_ROW_COLUMNS}
        """,
        node_id,
        user_id,
    )


async def delete_focus_node(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    node_id: int,
) -> bool:
    """Delete one focus node row (cascades to descendants)."""
    result = await conn.execute(
        f"""
        DELETE FROM {FOCUS_NODES}
        WHERE id = $1 AND user_id = $2
        """,
        node_id,
        user_id,
    )
    return result.endswith("1")


async def count_children_for_nodes(
    conn: asyncpg.Connection,
    node_ids: list[int],
) -> dict[int, int]:
    """Count direct children per node id."""
    if not node_ids:
        return {}
    rows = await conn.fetch(
        f"""
        SELECT parent_id, COUNT(*)::int AS child_count
        FROM {FOCUS_NODES}
        WHERE parent_id = ANY($1::int[])
        GROUP BY parent_id
        """,
        node_ids,
    )
    return {row["parent_id"]: row["child_count"] for row in rows}


async def next_node_sort_order(
    conn: asyncpg.Connection,
    user_id: int,
    *,
    parent_id: int | None,
) -> int:
    """Return the next sort_order among siblings."""
    value = await conn.fetchval(
        f"""
        SELECT COALESCE(MAX(sort_order), -1) + 1
        FROM {FOCUS_NODES}
        WHERE user_id = $1
          AND parent_id IS NOT DISTINCT FROM $2
        """,
        user_id,
        parent_id,
    )
    return int(value or 0)


async def next_hub_list_sort_order(
    conn: asyncpg.Connection,
    user_id: int,
) -> int:
    """Return the next sort_order for a new root hub list."""
    value = await conn.fetchval(
        f"""
        SELECT COALESCE(MAX(sort_order), -1) + 1
        FROM {FOCUS_NODES}
        WHERE user_id = $1
          AND kind = 'list'
          AND parent_id IS NULL
        """,
        user_id,
    )
    return int(value or 0)


async def clear_focus_node_origin_flags(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    except_node_id: int | None = None,
) -> None:
    """Clear is_origin on all list nodes for a user, optionally keeping one node."""
    if except_node_id is None:
        await conn.execute(
            f"""
            UPDATE {FOCUS_NODES}
            SET is_origin = FALSE, updated_at = NOW()
            WHERE user_id = $1 AND kind = 'list' AND is_origin = TRUE
            """,
            user_id,
        )
        return
    await conn.execute(
        f"""
        UPDATE {FOCUS_NODES}
        SET is_origin = FALSE, updated_at = NOW()
        WHERE user_id = $1 AND kind = 'list' AND is_origin = TRUE AND id <> $2
        """,
        user_id,
        except_node_id,
    )


async def batch_update_sort_orders(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    entries: list[tuple[int, int]],
) -> None:
    """Update sort_order for multiple owned nodes."""
    if not entries:
        return
    await conn.executemany(
        f"""
        UPDATE {FOCUS_NODES}
        SET sort_order = $3, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        """,
        [(node_id, user_id, sort_order) for node_id, sort_order in entries],
    )


async def fetch_subtree_nodes(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    root_id: int,
) -> list[asyncpg.Record]:
    """Fetch a node and all descendants."""
    return await conn.fetch(
        f"""
        WITH RECURSIVE subtree AS (
            SELECT id
            FROM {FOCUS_NODES}
            WHERE id = $2 AND user_id = $1
            UNION ALL
            SELECT fn.id
            FROM {FOCUS_NODES} fn
            INNER JOIN subtree s ON fn.parent_id = s.id
            WHERE fn.user_id = $1
        )
        SELECT {_NODE_ROW_COLUMNS}
        FROM {FOCUS_NODES}
        WHERE user_id = $1
          AND id IN (SELECT id FROM subtree)
        ORDER BY parent_id NULLS FIRST, sort_order ASC, id ASC
        """,
        user_id,
        root_id,
    )
