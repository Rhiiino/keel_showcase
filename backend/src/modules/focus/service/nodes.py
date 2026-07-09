# keel_api/src/modules/focus/service/nodes.py

"""Focus node CRUD and reordering."""

from __future__ import annotations

from datetime import UTC, datetime

from core.database import get_pool
from core.errors import AppError
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.focus import config, reference_registry
from modules.focus.repository import nodes as nodes_repository
from modules.focus.repository import tags as tags_repository
from modules.focus.schemas import (
    FocusNodeCreate,
    FocusNodePublic,
    FocusNodeReorder,
    FocusNodeUpdate,
)
from modules.focus.service.constellation_state import promote_constellation_position_key
from modules.focus.service.helpers import (
    load_owned_node,
    map_nodes,
    map_single_node,
    normalize_node_color_hex,
    normalize_title,
    normalize_title_font_key,
    read_reference_enabled_types,
    validate_container_parent,
    validate_node_kind,
    validate_node_status,
    validate_tag_ids,
    validate_work_order,
    would_create_parent_cycle,
)



async def list_focus_nodes(
    user_id: int,
    *,
    parent_id: int | None = None,
    roots_only: bool = False,
    kind: str | None = None,
    kinds: list[str] | None = None,
    status: str | None = None,
    hub_lists_only: bool = False,
) -> list[FocusNodePublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await nodes_repository.list_focus_nodes(
            conn,
            user_id,
            parent_id=parent_id,
            parent_id_is_null=True if roots_only else None,
            kind=kind,
            kinds=kinds,
            status=status,
            hub_lists_only=hub_lists_only,
        )
        return await map_nodes(conn, user_id=user_id, rows=rows)


async def get_focus_node(
    user_id: int,
    node_id: int,
    *,
    include_subtree: bool = False,
) -> FocusNodePublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        if include_subtree:
            rows = await nodes_repository.fetch_subtree_nodes(
                conn,
                user_id=user_id,
                root_id=node_id,
            )
            if not rows:
                raise AppError("Focus node not found.", status_code=404)
            mapped = await map_nodes(
                conn,
                user_id=user_id,
                rows=rows,
                include_children=True,
            )
            return mapped[0]

        row = await load_owned_node(conn, user_id=user_id, node_id=node_id)
        return await map_single_node(conn, user_id=user_id, row=row)


async def create_focus_node(user_id: int, payload: FocusNodeCreate) -> FocusNodePublic:
    kind = validate_node_kind(payload.kind)
    title = normalize_title(payload.title)

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            parent_id = payload.parent_id
            if parent_id is not None:
                await validate_container_parent(conn, user_id=user_id, parent_id=parent_id)

            if kind == "item":
                status = validate_node_status(payload.status or "active")
                work_order = validate_work_order(payload.work_order)
                sort_order = (
                    payload.sort_order
                    if payload.sort_order is not None
                    else await nodes_repository.next_node_sort_order(
                        conn,
                        user_id,
                        parent_id=parent_id,
                    )
                )
                completed_at = datetime.now(UTC) if status == "completed" else None
                row = await nodes_repository.insert_focus_node(
                    conn,
                    user_id=user_id,
                    parent_id=parent_id,
                    kind=kind,
                    title=title,
                    sort_order=sort_order,
                    notes=payload.notes,
                    status=status,
                    completed_at=completed_at,
                    work_order=work_order,
                )
                return await map_single_node(conn, user_id=user_id, row=row)

            if kind == "list":
                status = validate_node_status(payload.status or "active")
                work_order = validate_work_order(payload.work_order)
                if parent_id is None:
                    sort_order = (
                        payload.sort_order
                        if payload.sort_order is not None
                        else await nodes_repository.next_hub_list_sort_order(conn, user_id)
                    )
                else:
                    sort_order = (
                        payload.sort_order
                        if payload.sort_order is not None
                        else await nodes_repository.next_node_sort_order(
                            conn,
                            user_id,
                            parent_id=parent_id,
                        )
                    )
                completed_at = datetime.now(UTC) if status == "completed" else None
                node_color_hex = normalize_node_color_hex(payload.node_color_hex)
                title_font_key = normalize_title_font_key(payload.title_font_key)
                await validate_tag_ids(conn, user_id=user_id, tag_ids=payload.tag_ids)
                if payload.is_origin:
                    await nodes_repository.clear_focus_node_origin_flags(
                        conn,
                        user_id=user_id,
                    )
                row = await nodes_repository.insert_focus_node(
                    conn,
                    user_id=user_id,
                    parent_id=parent_id,
                    kind=kind,
                    title=title,
                    sort_order=sort_order,
                    notes=payload.notes,
                    status=status,
                    completed_at=completed_at,
                    work_order=work_order,
                    node_color_hex=node_color_hex,
                    title_font_key=title_font_key,
                    is_origin=bool(payload.is_origin),
                )
                if payload.tag_ids is not None:
                    await tags_repository.replace_node_tags(
                        conn,
                        node_id=int(row["id"]),
                        tag_ids=payload.tag_ids,
                    )
                refreshed = await nodes_repository.get_focus_node(
                    conn,
                    user_id=user_id,
                    node_id=int(row["id"]),
                )
                return await map_single_node(conn, user_id=user_id, row=refreshed)

            if payload.reference_target_type is None or payload.reference_target_id is None:
                raise AppError(
                    "Record nodes require reference_target_type and reference_target_id.",
                    status_code=400,
                )
            target_type = payload.reference_target_type.strip().lower()
            target_id = str(payload.reference_target_id).strip()
            if not target_id:
                raise AppError("Record nodes require a reference target id.", status_code=400)
            enabled_types = set(await read_reference_enabled_types(conn, user_id))
            if target_type not in enabled_types:
                raise AppError("Reference type is disabled.", status_code=400)
            if reference_registry.get_reference_type_meta(target_type) is None:
                raise AppError("Unknown reference type.", status_code=400)
            if not await reference_registry.reference_target_exists(
                conn,
                user_id=user_id,
                target_type=target_type,
                target_id=target_id,
            ):
                raise AppError("Reference target was not found.", status_code=400)

            status = validate_node_status(payload.status or "active")
            work_order = validate_work_order(payload.work_order)
            completed_at = datetime.now(UTC) if status == "completed" else None
            node_color_hex = normalize_node_color_hex(payload.node_color_hex)
            title_font_key = normalize_title_font_key(payload.title_font_key)
            await validate_tag_ids(conn, user_id=user_id, tag_ids=payload.tag_ids)
            sort_order = (
                payload.sort_order
                if payload.sort_order is not None
                else await nodes_repository.next_node_sort_order(
                    conn,
                    user_id,
                    parent_id=parent_id,
                )
            )
            row = await nodes_repository.insert_focus_node(
                conn,
                user_id=user_id,
                parent_id=parent_id,
                kind=kind,
                title=title,
                sort_order=sort_order,
                notes=payload.notes,
                status=status,
                completed_at=completed_at,
                work_order=work_order,
                node_color_hex=node_color_hex,
                title_font_key=title_font_key,
                reference_target_type=target_type,
                reference_target_id=target_id,
                show_reference_content=(
                    bool(payload.show_reference_content)
                    if target_type == "media_object" and payload.show_reference_content
                    else False
                ),
            )
            if payload.tag_ids is not None:
                await tags_repository.replace_node_tags(
                    conn,
                    node_id=int(row["id"]),
                    tag_ids=payload.tag_ids,
                )
            refreshed = await nodes_repository.get_focus_node(
                conn,
                user_id=user_id,
                node_id=int(row["id"]),
            )
            return await map_single_node(conn, user_id=user_id, row=refreshed)

    raise AppError("Unsupported node kind.", status_code=400)


async def update_focus_node(
    user_id: int,
    node_id: int,
    payload: FocusNodeUpdate,
) -> FocusNodePublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            existing = await load_owned_node(conn, user_id=user_id, node_id=node_id)
            kind = existing["kind"]

            if payload.kind is not None:
                target_kind = validate_node_kind(payload.kind)
                if target_kind != kind:
                    if kind != "item" or target_kind != "list":
                        raise AppError(
                            "Only item nodes can be promoted to list nodes.",
                            status_code=400,
                        )
                    if payload.model_fields_set - {"kind"}:
                        raise AppError(
                            "Promotion cannot be combined with other node updates.",
                            status_code=400,
                        )
                    row = await nodes_repository.promote_focus_item_to_list(
                        conn,
                        user_id=user_id,
                        node_id=node_id,
                    )
                    if row is None:
                        raise AppError("Focus node not found.", status_code=404)
                    await promote_constellation_position_key(
                        conn,
                        user_id=user_id,
                        node_id=node_id,
                    )
                    return await map_single_node(conn, user_id=user_id, row=row)

            update_parent_id = payload.parent_id is not None or (
                "parent_id" in payload.model_fields_set and payload.parent_id is None
            )
            new_parent_id = payload.parent_id
            if update_parent_id and new_parent_id is not None:
                await validate_container_parent(
                    conn,
                    user_id=user_id,
                    parent_id=new_parent_id,
                )
                if await would_create_parent_cycle(
                    conn,
                    user_id=user_id,
                    node_id=node_id,
                    new_parent_id=new_parent_id,
                ):
                    raise AppError("Reparenting would create a cycle.", status_code=400)

            title = (
                normalize_title(payload.title)
                if payload.title is not None
                else None
            )
            status = (
                validate_node_status(payload.status)
                if payload.status is not None
                else None
            )
            update_work_order = payload.work_order is not None or (
                "work_order" in payload.model_fields_set and payload.work_order is None
            )
            work_order = (
                validate_work_order(payload.work_order)
                if update_work_order
                else None
            )

            update_completed_at = False
            completed_at = existing["completed_at"]
            if status is not None:
                if status == "completed" and existing["status"] != "completed":
                    completed_at = datetime.now(UTC)
                    update_completed_at = True
                elif status != "completed" and existing["status"] == "completed":
                    completed_at = None
                    update_completed_at = True

            update_node_color_hex = payload.node_color_hex is not None or (
                "node_color_hex" in payload.model_fields_set and payload.node_color_hex is None
            )
            node_color_hex = (
                normalize_node_color_hex(payload.node_color_hex)
                if update_node_color_hex
                and kind in config.CONTAINER_PRESENTATION_KINDS
                else None
            )
            update_title_font_key = payload.title_font_key is not None or (
                "title_font_key" in payload.model_fields_set and payload.title_font_key is None
            )
            title_font_key = (
                normalize_title_font_key(payload.title_font_key)
                if update_title_font_key
                and kind in config.CONTAINER_PRESENTATION_KINDS
                else None
            )

            update_reference_target = False
            reference_target_type = existing["reference_target_type"]
            reference_target_id = existing["reference_target_id"]
            update_show_reference_content = False
            show_reference_content = existing["show_reference_content"]
            if kind == "record" and (
                payload.reference_target_type is not None
                or payload.reference_target_id is not None
            ):
                reference_target_type = (
                    payload.reference_target_type or reference_target_type
                ).strip().lower()
                reference_target_id = str(
                    payload.reference_target_id
                    if payload.reference_target_id is not None
                    else reference_target_id,
                ).strip()
                if not reference_target_id:
                    raise AppError("Record nodes require a reference target id.", status_code=400)
                enabled_types = set(await read_reference_enabled_types(conn, user_id))
                if reference_target_type not in enabled_types:
                    raise AppError("Reference type is disabled.", status_code=400)
                if not await reference_registry.reference_target_exists(
                    conn,
                    user_id=user_id,
                    target_type=reference_target_type,
                    target_id=reference_target_id,
                ):
                    raise AppError("Reference target was not found.", status_code=400)
                update_reference_target = True
                if reference_target_type != "media_object":
                    show_reference_content = False
                    update_show_reference_content = True

            if payload.show_reference_content is not None:
                if kind != "record":
                    raise AppError(
                        "Only record nodes support show_reference_content.",
                        status_code=400,
                    )
                if reference_target_type != "media_object":
                    raise AppError(
                        "Reference content preview is only supported for media objects.",
                        status_code=400,
                    )
                show_reference_content = bool(payload.show_reference_content)
                update_show_reference_content = True

            if kind == "list" and payload.is_origin:
                await nodes_repository.clear_focus_node_origin_flags(
                    conn,
                    user_id=user_id,
                    except_node_id=node_id,
                )

            if kind in config.CONTAINER_PRESENTATION_KINDS and payload.tag_ids is not None:
                await validate_tag_ids(conn, user_id=user_id, tag_ids=payload.tag_ids)

            row = await nodes_repository.update_focus_node(
                conn,
                user_id=user_id,
                node_id=node_id,
                parent_id=new_parent_id,
                update_parent_id=update_parent_id,
                title=title,
                sort_order=payload.sort_order,
                notes=payload.notes,
                status=status,
                completed_at=completed_at,
                update_completed_at=update_completed_at,
                work_order=work_order,
                update_work_order=update_work_order,
                node_color_hex=node_color_hex,
                update_node_color_hex=(
                    update_node_color_hex
                    and kind in config.CONTAINER_PRESENTATION_KINDS
                ),
                title_font_key=title_font_key,
                update_title_font_key=(
                    update_title_font_key
                    and kind in config.CONTAINER_PRESENTATION_KINDS
                ),
                is_origin=payload.is_origin if kind == "list" else None,
                update_is_origin=payload.is_origin is not None and kind == "list",
                reference_target_type=reference_target_type,
                reference_target_id=reference_target_id,
                update_reference_target=update_reference_target,
                show_reference_content=show_reference_content,
                update_show_reference_content=update_show_reference_content,
            )
            if row is None:
                raise AppError("Focus node not found.", status_code=404)

            if kind in config.CONTAINER_PRESENTATION_KINDS and payload.tag_ids is not None:
                await tags_repository.replace_node_tags(
                    conn,
                    node_id=node_id,
                    tag_ids=payload.tag_ids,
                )

            return await map_single_node(conn, user_id=user_id, row=row)


async def complete_focus_node(user_id: int, node_id: int) -> FocusNodePublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await load_owned_node(conn, user_id=user_id, node_id=node_id)
        if row["kind"] != "item":
            raise AppError("Only item nodes can be completed.", status_code=400)
        updated = await nodes_repository.update_focus_node(
            conn,
            user_id=user_id,
            node_id=node_id,
            status="completed",
            completed_at=datetime.now(UTC),
            update_completed_at=True,
        )
        if updated is None:
            raise AppError("Focus node not found.", status_code=404)
        return await map_single_node(conn, user_id=user_id, row=updated)


async def delete_focus_node(user_id: int, node_id: int) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await nodes_repository.get_focus_node(conn, user_id=user_id, node_id=node_id)
        if row is None:
            raise AppError("Focus node not found.", status_code=404)
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.FOCUS_NODE,
        str(node_id),
    )


async def reorder_focus_nodes(user_id: int, payload: FocusNodeReorder) -> list[FocusNodePublic]:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            node_ids = [entry.id for entry in payload.entries]
            rows = await nodes_repository.list_focus_nodes(
                conn,
                user_id,
                node_ids=node_ids,
            )
            if len(rows) != len(set(node_ids)):
                raise AppError("One or more nodes were not found.", status_code=404)

            parent_ids = {row["parent_id"] for row in rows}
            if len(parent_ids) != 1:
                raise AppError("All reordered nodes must share the same parent.", status_code=400)

            await nodes_repository.batch_update_sort_orders(
                conn,
                user_id=user_id,
                entries=[(entry.id, entry.sort_order) for entry in payload.entries],
            )
            refreshed = await nodes_repository.list_focus_nodes(
                conn,
                user_id,
                parent_id=next(iter(parent_ids)),
            )
            return await map_nodes(conn, user_id=user_id, rows=refreshed)
