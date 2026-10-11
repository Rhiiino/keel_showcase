# keel_showcase/backend/scripts/db/demo/seeds/coak.py

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from uuid import UUID

import asyncpg

from core import tables

from context import DemoContext, fetch_or_insert

from seeds.coak_fixture_media import ensure_fixture_media


_FIXTURE_FILES = ("geography.json", "machine_learning.json", "swe.json")
_FIXTURES_DIR = Path(__file__).resolve().parent.parent / "fixtures" / "coak"


async def _seed_coak_tag(
    conn: asyncpg.Connection,
    ctx: DemoContext,
    record_id: int,
    name: str,
    color: str,
    description: str | None = None,
) -> int:
    if description is None:
        row = await conn.fetchrow(
            f"""
            INSERT INTO {tables.COAK_TAGS}
                (coak_record_id, user_id, name, color_hex)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (coak_record_id, name) DO UPDATE
            SET color_hex = EXCLUDED.color_hex
            RETURNING id, (xmax = 0) AS inserted
            """,
            record_id,
            ctx.user_id,
            name,
            color,
        )
    else:
        row = await conn.fetchrow(
            f"""
            INSERT INTO {tables.COAK_TAGS}
                (coak_record_id, user_id, name, color_hex, description)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (coak_record_id, name) DO UPDATE
            SET color_hex = EXCLUDED.color_hex,
                description = EXCLUDED.description
            RETURNING id, (xmax = 0) AS inserted
            """,
            record_id,
            ctx.user_id,
            name,
            color,
            description,
        )
    if row["inserted"]:
        ctx.stats.inserted_one(tables.COAK_TAGS)
    else:
        ctx.stats.reused_one(tables.COAK_TAGS)
    return int(row["id"])


async def _seed_coak_item(
    conn: asyncpg.Connection,
    ctx: DemoContext,
    record_id: int,
    key: str,
    *,
    parent_id: int | None,
    kind: str,
    name: str,
    sort_order: int,
    note_body: str = "",
    flash_front: str = "",
    flash_back: str = "",
    color_hex: str | None = None,
    media_id: UUID | None = None,
) -> int:
    existing = await conn.fetchval(
        f"""
        SELECT id FROM {tables.COAK_ITEMS}
        WHERE coak_record_id = $1 AND parent_id IS NOT DISTINCT FROM $2 AND name = $3
        ORDER BY id LIMIT 1
        """,
        record_id,
        parent_id,
        name,
    )
    if existing is not None:
        ctx.stats.reused_one(tables.COAK_ITEMS)
        item_id = int(existing)
        if media_id is not None:
            await conn.execute(
                f"""
                UPDATE {tables.COAK_ITEMS}
                SET media_id = $1
                WHERE id = $2 AND coak_record_id = $3
                """,
                media_id,
                item_id,
                record_id,
            )
    else:
        if color_hex is None:
            item_id = await conn.fetchval(
                f"""
                INSERT INTO {tables.COAK_ITEMS}
                    (
                        coak_record_id, user_id, parent_id, kind, name, sort_order,
                        note_body, flash_front, flash_back, media_id
                    )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id
                """,
                record_id,
                ctx.user_id,
                parent_id,
                kind,
                name,
                sort_order,
                note_body,
                flash_front,
                flash_back,
                media_id,
            )
        else:
            item_id = await conn.fetchval(
                f"""
                INSERT INTO {tables.COAK_ITEMS}
                    (
                        coak_record_id, user_id, parent_id, kind, name, color_hex, sort_order,
                        note_body, flash_front, flash_back, media_id
                    )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id
                """,
                record_id,
                ctx.user_id,
                parent_id,
                kind,
                name,
                color_hex,
                sort_order,
                note_body,
                flash_front,
                flash_back,
                media_id,
            )
        ctx.stats.inserted_one(tables.COAK_ITEMS)
        item_id = int(item_id)
    ctx.coak_items[key] = item_id
    return item_id



# ----- Demo product ideas record
async def _seed_demo_product_ideas(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    record_id = await fetch_or_insert(
        conn,
        ctx,
        table_key=tables.COAK_RECORDS,
        select_sql=f"""
            SELECT id FROM {tables.COAK_RECORDS}
            WHERE user_id = $1 AND name = 'Demo: Product Ideas'
            ORDER BY id LIMIT 1
        """,
        select_args=(ctx.user_id,),
        insert_sql=f"""
            INSERT INTO {tables.COAK_RECORDS}
                (user_id, name, color_hex)
            VALUES ($1, 'Demo: Product Ideas', '#8B5CF6')
            RETURNING id
        """,
        insert_args=(ctx.user_id,),
    )
    ctx.coak_records["ideas"] = record_id

    arch_folder = await _seed_coak_item(
        conn,
        ctx,
        record_id,
        "arch_folder",
        parent_id=None,
        kind="folder",
        name="Architecture",
        sort_order=0,
    )
    inspiration_folder = await _seed_coak_item(
        conn,
        ctx,
        record_id,
        "inspiration_folder",
        parent_id=None,
        kind="folder",
        name="Inspiration",
        sort_order=1,
    )
    monolith_note = await _seed_coak_item(
        conn,
        ctx,
        record_id,
        "monolith_note",
        parent_id=arch_folder,
        kind="note",
        name="Demo: Modular monolith boundaries",
        sort_order=0,
        note_body="Keep feature modules isolated behind manifest registries and shared core utilities.",
    )
    sse_note = await _seed_coak_item(
        conn,
        ctx,
        record_id,
        "sse_note",
        parent_id=arch_folder,
        kind="note",
        name="Demo: SSE chat flow",
        sort_order=1,
        note_body="User message persists first, then the Keel orchestrator streams tool calls and assistant output.",
    )
    agent_flash = await _seed_coak_item(
        conn,
        ctx,
        record_id,
        "agent_flash",
        parent_id=arch_folder,
        kind="flash",
        name="Showcase chat agent",
        sort_order=2,
        flash_front="What agent drives showcase chat?",
        flash_back="Keel orchestrator",
    )
    login_flash = await _seed_coak_item(
        conn,
        ctx,
        record_id,
        "login_flash",
        parent_id=arch_folder,
        kind="flash",
        name="Showcase login",
        sort_order=3,
        flash_front="Showcase login method?",
        flash_back="Enter button, shared demo user",
    )
    inspiration_note = await _seed_coak_item(
        conn,
        ctx,
        record_id,
        "inspiration_note",
        parent_id=inspiration_folder,
        kind="note",
        name="Demo: Visitor-first onboarding",
        sort_order=0,
        note_body="Seed realistic demo data so every module looks alive on first visit.",
    )

    ideas_tag = await _seed_coak_tag(conn, ctx, record_id, "Ideas", "#8B5CF6")
    reference_tag = await _seed_coak_tag(conn, ctx, record_id, "Reference", "#06B6D4")
    for item_id in (monolith_note, sse_note, agent_flash, login_flash, inspiration_note):
        await conn.execute(
            f"""
            INSERT INTO {tables.COAK_ITEM_TAG_ASSIGNMENTS}
                (coak_item_id, coak_record_id, tag_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (coak_item_id, tag_id) DO NOTHING
            """,
            item_id,
            record_id,
            ideas_tag,
        )
    await conn.execute(
        f"""
        INSERT INTO {tables.COAK_ITEM_TAG_ASSIGNMENTS}
            (coak_item_id, coak_record_id, tag_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (coak_item_id, tag_id) DO NOTHING
        """,
        sse_note,
        record_id,
        reference_tag,
    )



# ----- Fixture import helpers
def _item_depth(item: dict[str, Any]) -> int:
    path_key = str(item["path_key"])
    return 0 if "/" not in path_key else path_key.count("/")


def _resolve_workspace_state(
    state: Any,
    key_to_id: dict[str, int],
) -> dict[str, Any]:
    if not isinstance(state, dict):
        return {}
    out = dict(state)
    nodes = out.get("node_positions")
    if isinstance(nodes, list):
        resolved: list[dict[str, Any]] = []
        for node in nodes:
            if not isinstance(node, dict):
                continue
            path_key = node.get("path_key")
            if path_key is None:
                continue
            item_id = key_to_id.get(str(path_key))
            if item_id is None:
                continue
            new_node = {k: v for k, v in node.items() if k != "path_key"}
            new_node["item_id"] = item_id
            resolved.append(new_node)
        out["node_positions"] = resolved
    for field in ("pinned_item_ids", "expanded_folder_ids"):
        values = out.get(field)
        if isinstance(values, list):
            out[field] = [
                key_to_id[str(value)]
                for value in values
                if str(value) in key_to_id
            ]
    return out


async def _import_coak_fixture(
    conn: asyncpg.Connection,
    ctx: DemoContext,
    fixture: dict[str, Any],
) -> None:
    record_spec = fixture["record"]
    record_name = str(record_spec["name"])
    record_id = await fetch_or_insert(
        conn,
        ctx,
        table_key=tables.COAK_RECORDS,
        select_sql=f"""
            SELECT id FROM {tables.COAK_RECORDS}
            WHERE user_id = $1 AND name = $2
            ORDER BY id LIMIT 1
        """,
        select_args=(ctx.user_id, record_name),
        insert_sql=f"""
            INSERT INTO {tables.COAK_RECORDS}
                (user_id, name, color_hex)
            VALUES ($1, $2, $3)
            RETURNING id
        """,
        insert_args=(ctx.user_id, record_name, record_spec["color_hex"]),
    )

    key_to_id: dict[str, int] = {}
    items = sorted(fixture.get("items", []), key=_item_depth)
    for item in items:
        path_key = str(item["path_key"])
        parent_path_key = item.get("parent_path_key")
        parent_id = key_to_id.get(str(parent_path_key)) if parent_path_key else None
        media_id: UUID | None = None
        media_spec = item.get("media")
        if isinstance(media_spec, dict):
            media_id = await ensure_fixture_media(
                conn,
                ctx,
                user_id=ctx.user_id,
                media_spec=media_spec,
            )
        item_id = await _seed_coak_item(
            conn,
            ctx,
            record_id,
            path_key,
            parent_id=parent_id,
            kind=str(item["kind"]),
            name=str(item["name"]),
            sort_order=int(item.get("sort_order", 0)),
            note_body=str(item.get("note_body", "")),
            flash_front=str(item.get("flash_front", "")),
            flash_back=str(item.get("flash_back", "")),
            color_hex=item.get("color_hex"),
            media_id=media_id,
        )
        key_to_id[path_key] = item_id

    workspace_state = _resolve_workspace_state(
        record_spec.get("workspace_state", {}),
        key_to_id,
    )
    await conn.execute(
        f"""
        UPDATE {tables.COAK_RECORDS}
        SET color_hex = $1,
            workspace_state = $2::jsonb,
            workspace_settings = $3::jsonb,
            configuration_settings = $4::jsonb
        WHERE id = $5
        """,
        record_spec["color_hex"],
        json.dumps(workspace_state),
        json.dumps(record_spec.get("workspace_settings", {})),
        json.dumps(record_spec.get("configuration_settings", {})),
        record_id,
    )

    tag_name_to_id: dict[str, int] = {}
    for tag in fixture.get("tags", []):
        tag_id = await _seed_coak_tag(
            conn,
            ctx,
            record_id,
            str(tag["name"]),
            str(tag["color_hex"]),
            tag.get("description"),
        )
        tag_name_to_id[str(tag["name"])] = tag_id

    for assignment in fixture.get("tag_assignments", []):
        item_path_key = str(assignment["item_path_key"])
        tag_name = str(assignment["tag_name"])
        item_id = key_to_id.get(item_path_key)
        tag_id = tag_name_to_id.get(tag_name)
        if item_id is None or tag_id is None:
            continue
        await conn.execute(
            f"""
            INSERT INTO {tables.COAK_ITEM_TAG_ASSIGNMENTS}
                (coak_item_id, coak_record_id, tag_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (coak_item_id, tag_id) DO NOTHING
            """,
            item_id,
            record_id,
            tag_id,
        )

    ctx.coak_records[record_name] = record_id


async def _seed_coak_fixtures(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    for filename in _FIXTURE_FILES:
        path = _FIXTURES_DIR / filename
        if not path.exists():
            continue
        fixture = json.loads(path.read_text(encoding="utf-8"))
        await _import_coak_fixture(conn, ctx, fixture)



# ----- Entry point
async def seed_coak(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    await _seed_demo_product_ideas(conn, ctx)
    await _seed_coak_fixtures(conn, ctx)
