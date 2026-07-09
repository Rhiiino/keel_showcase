# keel_api/src/modules/projects/service/projects.py

"""Business logic for personal projects and workspace canvas."""

from __future__ import annotations

import json
import re
from uuid import UUID

import asyncpg
from asyncpg.exceptions import UniqueViolationError

from core.database import get_pool
from core.errors import AppError
from modules.deleted import entity_types as deleted_entity_types
from modules.deleted import service as deleted_service
from modules.media import service as media_service
from modules.media.schemas import MediaAttachmentPublic, MediaPublic
from modules.projects import config
from modules.projects.repository import canvas_repository, repository, tags_repository
from modules.projects.schemas import (
    ProjectCreate,
    ProjectPublic,
    ProjectTagCreate,
    ProjectTagPublic,
    ProjectTagUpdate,
    ProjectUpdate,
    ProjectWorkspacePublic,
    ProjectWorkspaceSettingsPublic,
    ProjectWorkspaceSettingsUpdate,
)
from modules.projects.workspace_state import normalize_workspace_state

from . import workspace_settings as workspace_settings_service

_VALID_STATUSES = frozenset({"planning", "active", "paused", "completed", "archived"})



# ----- Mapping helpers
def _record_to_tag(row: asyncpg.Record) -> ProjectTagPublic:
    """Map a database row to ProjectTagPublic."""
    return ProjectTagPublic(
        id=row["id"],
        name=row["name"],
        description=row.get("description"),
        color_hex=row["color_hex"],
        project_count=int(row.get("project_count") or 0),
    )


def _normalize_tag_description(description: str | None) -> str | None:
    if description is None:
        return None
    normalized = description.strip()
    if not normalized:
        return None
    if len(normalized) > 512:
        raise AppError("Tag description must be at most 512 characters.", status_code=400)
    return normalized


def _record_to_project(
    row: asyncpg.Record,
    *,
    tags: list[ProjectTagPublic] | None = None,
    cover: MediaPublic | None = None,
    gallery: list[MediaAttachmentPublic] | None = None,
) -> ProjectPublic:
    """Map a database row to ProjectPublic."""
    return ProjectPublic(
        id=row["id"],
        user_id=row["user_id"],
        title=row["title"],
        description=row["description"],
        status=row["status"],
        kind=row["kind"],
        cover=cover,
        gallery=gallery or [],
        cover_glow_color_hex=row.get("cover_glow_color_hex"),
        cover_model_color_hex=row.get("cover_model_color_hex"),
        cover_model_brightness=_normalize_cover_model_brightness(
            row.get("cover_model_brightness"),
        ),
        cover_image_scale=_normalize_cover_image_scale(
            row.get("cover_image_scale"),
        ),
        cover_image_position_x=_normalize_cover_image_position_x(
            row.get("cover_image_position_x"),
        ),
        cover_image_position_y=_normalize_cover_image_position_y(
            row.get("cover_image_position_y"),
        ),
        kanban_card_color_hex=row.get("kanban_card_color_hex"),
        title_font_key=row.get("title_font_key"),
        tags=tags or [],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )



# ----- Normalization helpers
def _normalize_tag_name(name: str) -> str:
    """Normalize and validate a project tag name."""
    normalized = name.strip()
    if not normalized:
        raise AppError("Tag name is required.", status_code=400)
    if len(normalized) > 80:
        raise AppError("Tag name must be at most 80 characters.", status_code=400)
    return normalized


def _normalize_tag_color(color_hex: str | None) -> str:
    """Normalize a tag color hex or return the default."""
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


def _normalize_cover_model_brightness(value: float | None) -> float:
    """Clamp cover model brightness to a valid range."""
    if value is None:
        return 1.0
    try:
        brightness = float(value)
    except (TypeError, ValueError):
        return 1.0
    return max(0.5, min(2.0, brightness))


def _normalize_cover_image_scale(value: float | None) -> float:
    """Clamp image cover zoom scale to a valid range."""
    if value is None:
        return 1.0
    try:
        scale = float(value)
    except (TypeError, ValueError):
        return 1.0
    return max(0.25, min(3.0, scale))


def _normalize_cover_image_position_x(value: float | None) -> float:
    """Clamp image cover horizontal focal point to a valid percentage."""
    if value is None:
        return 50.0
    try:
        position_x = float(value)
    except (TypeError, ValueError):
        return 50.0
    return max(0.0, min(100.0, position_x))


def _normalize_cover_image_position_y(value: float | None) -> float:
    """Clamp image cover vertical focal point to a valid percentage."""
    if value is None:
        return 50.0
    try:
        position_y = float(value)
    except (TypeError, ValueError):
        return 50.0
    return max(0.0, min(100.0, position_y))


def _normalize_title_font_key(title_font_key: str | None) -> str | None:
    """Validate a title font key against allowed values."""
    if title_font_key is None:
        return None
    normalized = title_font_key.strip().lower()
    if not normalized or normalized == config.DEFAULT_TITLE_FONT_KEY:
        return None
    if normalized not in config.ALLOWED_TITLE_FONT_KEYS:
        allowed = ", ".join(sorted(config.ALLOWED_TITLE_FONT_KEYS))
        raise AppError(
            f"title_font_key must be one of: {allowed}.",
            status_code=400,
        )
    return normalized


def _normalize_status(status: str) -> str:
    """Normalize and validate a project status value."""
    normalized = status.strip().lower()
    if normalized not in _VALID_STATUSES:
        raise AppError(
            f"Invalid status {status!r}; expected planning, active, paused, completed, or archived.",
            status_code=400,
        )
    return normalized


def _dedupe_tag_ids(tag_ids: list[int]) -> list[int]:
    """Return tag ids in order with duplicates removed."""
    seen: set[int] = set()
    deduped: list[int] = []
    for tag_id in tag_ids:
        if tag_id in seen:
            continue
        seen.add(tag_id)
        deduped.append(tag_id)
    return deduped



# ----- Internal loaders
async def _tags_for_project_rows(
    conn: asyncpg.Connection,
    rows: list[asyncpg.Record],
) -> dict[int, list[ProjectTagPublic]]:
    """Load tags for a batch of project rows."""
    project_ids = [row["id"] for row in rows]
    grouped = await tags_repository.fetch_tags_for_projects(conn, project_ids)
    return {
        project_id: [_record_to_tag(tag_row) for tag_row in tag_rows]
        for project_id, tag_rows in grouped.items()
    }


async def _media_for_project(
    conn: asyncpg.Connection,
    project_id: int,
) -> tuple[MediaPublic | None, list[MediaAttachmentPublic]]:
    """Load cover and gallery attachments for a project."""
    cover_attachment = await media_service.get_attachment_for_entity_role(
        conn,
        entity_type="project",
        entity_id=project_id,
        role="cover",
    )
    gallery = await media_service.list_gallery_for_entity(
        conn,
        entity_type="project",
        entity_id=project_id,
    )
    cover = cover_attachment.media if cover_attachment else None
    return cover, gallery


async def _project_public_from_row(
    conn: asyncpg.Connection,
    row: asyncpg.Record,
) -> ProjectPublic:
    """Build ProjectPublic from a row with tags and media loaded."""
    tags_by_project = await _tags_for_project_rows(conn, [row])
    cover, gallery = await _media_for_project(conn, row["id"])
    return _record_to_project(
        row,
        tags=tags_by_project.get(row["id"], []),
        cover=cover,
        gallery=gallery,
    )


async def _validate_project_tag_ids(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    tag_ids: list[int],
) -> list[int]:
    """Ensure tag ids exist and belong to the user."""
    deduped = _dedupe_tag_ids(tag_ids)
    if not deduped:
        return []

    owned_count = await tags_repository.count_owned_tags(
        conn,
        user_id=user_id,
        tag_ids=deduped,
    )
    if owned_count != len(deduped):
        raise AppError("One or more tags were not found.", status_code=400)
    return deduped


async def _get_owned_project_row(
    conn: asyncpg.Connection,
    user_id: int,
    project_id: int,
) -> asyncpg.Record:
    """Return the owned project row or raise 404."""
    row = await repository.get_project(conn, project_id)
    if row is None or row["user_id"] != user_id:
        raise AppError("Project not found.", status_code=404)
    return row



# ----- Projects CRUD
async def list_projects(user_id: int) -> list[ProjectPublic]:
    """List projects for a user, most recently updated first."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await repository.list_projects(conn, user_id)
        tags_by_project = await _tags_for_project_rows(conn, rows)
        results: list[ProjectPublic] = []
        for row in rows:
            cover, gallery = await _media_for_project(conn, row["id"])
            results.append(
                _record_to_project(
                    row,
                    tags=tags_by_project.get(row["id"], []),
                    cover=cover,
                    gallery=gallery,
                )
            )
    return results


async def create_project(user_id: int, payload: ProjectCreate) -> ProjectPublic:
    """Create a new project for a user."""
    title = payload.title.strip()
    if not title:
        raise AppError("Project title is required.", status_code=400)

    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.insert_project(
            conn,
            user_id=user_id,
            title=title,
            description=payload.description.strip(),
            status=_normalize_status(payload.status),
            kind=payload.kind.strip() if payload.kind else None,
        )
    return _record_to_project(row)


async def get_project(user_id: int, project_id: int) -> ProjectPublic:
    """Fetch one owned project."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await _get_owned_project_row(conn, user_id, project_id)
        return await _project_public_from_row(conn, row)


async def update_project(
    user_id: int,
    project_id: int,
    payload: ProjectUpdate,
) -> ProjectPublic:
    """Update project metadata and tags."""
    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await _get_owned_project_row(conn, user_id, project_id)

        title = existing["title"]
        if payload.title is not None:
            title = payload.title.strip()
            if not title:
                raise AppError("Project title is required.", status_code=400)

        description = existing["description"]
        if payload.description is not None:
            description = payload.description.strip()

        status = existing["status"]
        if payload.status is not None:
            status = _normalize_status(payload.status)

        kind = existing["kind"]
        if payload.kind is not None:
            kind = payload.kind.strip() or None

        cover_glow_color_hex = existing["cover_glow_color_hex"]
        if "cover_glow_color_hex" in payload.model_fields_set:
            if payload.cover_glow_color_hex is None:
                cover_glow_color_hex = None
            else:
                cover_glow_color_hex = _normalize_tag_color(payload.cover_glow_color_hex)

        cover_model_color_hex = existing["cover_model_color_hex"]
        if "cover_model_color_hex" in payload.model_fields_set:
            if payload.cover_model_color_hex is None:
                cover_model_color_hex = None
            else:
                cover_model_color_hex = _normalize_tag_color(payload.cover_model_color_hex)

        kanban_card_color_hex = existing["kanban_card_color_hex"]
        if "kanban_card_color_hex" in payload.model_fields_set:
            if payload.kanban_card_color_hex is None:
                kanban_card_color_hex = None
            else:
                kanban_card_color_hex = _normalize_tag_color(payload.kanban_card_color_hex)

        title_font_key = existing["title_font_key"]
        if "title_font_key" in payload.model_fields_set:
            title_font_key = _normalize_title_font_key(payload.title_font_key)

        cover_model_brightness = _normalize_cover_model_brightness(
            existing.get("cover_model_brightness"),
        )
        if "cover_model_brightness" in payload.model_fields_set:
            if payload.cover_model_brightness is None:
                cover_model_brightness = 1.0
            else:
                cover_model_brightness = _normalize_cover_model_brightness(
                    payload.cover_model_brightness,
                )

        cover_image_scale = _normalize_cover_image_scale(
            existing.get("cover_image_scale"),
        )
        if "cover_image_scale" in payload.model_fields_set:
            if payload.cover_image_scale is None:
                cover_image_scale = 1.0
            else:
                cover_image_scale = _normalize_cover_image_scale(payload.cover_image_scale)

        cover_image_position_x = _normalize_cover_image_position_x(
            existing.get("cover_image_position_x"),
        )
        if "cover_image_position_x" in payload.model_fields_set:
            if payload.cover_image_position_x is None:
                cover_image_position_x = 50.0
            else:
                cover_image_position_x = _normalize_cover_image_position_x(
                    payload.cover_image_position_x,
                )

        cover_image_position_y = _normalize_cover_image_position_y(
            existing.get("cover_image_position_y"),
        )
        if "cover_image_position_y" in payload.model_fields_set:
            if payload.cover_image_position_y is None:
                cover_image_position_y = 50.0
            else:
                cover_image_position_y = _normalize_cover_image_position_y(
                    payload.cover_image_position_y,
                )

        row = await repository.update_project(
            conn,
            project_id=project_id,
            title=title,
            description=description,
            status=status,
            kind=kind,
            cover_glow_color_hex=cover_glow_color_hex,
            cover_model_color_hex=cover_model_color_hex,
            cover_model_brightness=cover_model_brightness,
            cover_image_scale=cover_image_scale,
            cover_image_position_x=cover_image_position_x,
            cover_image_position_y=cover_image_position_y,
            kanban_card_color_hex=kanban_card_color_hex,
            title_font_key=title_font_key,
        )
        if row is None:
            raise AppError("Project not found.", status_code=404)

        if payload.tag_ids is not None:
            validated_tag_ids = await _validate_project_tag_ids(
                conn,
                user_id=user_id,
                tag_ids=payload.tag_ids,
            )
            await tags_repository.replace_project_tags(
                conn,
                project_id=project_id,
                tag_ids=validated_tag_ids,
            )

        refreshed = await repository.get_project(conn, project_id)
        if refreshed is None:
            raise AppError("Project not found.", status_code=404)
        return await _project_public_from_row(conn, refreshed)


async def delete_project(user_id: int, project_id: int) -> None:
    """Delete a project (media attachments cascade via entity lifecycle)."""
    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_project_row(conn, user_id, project_id)
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.PROJECT,
        str(project_id),
    )



# ----- Project tags
async def list_project_tags(user_id: int) -> list[ProjectTagPublic]:
    """List project tags for a user."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await tags_repository.list_user_tags(conn, user_id)
    return [_record_to_tag(row) for row in rows]


async def create_project_tag(user_id: int, payload: ProjectTagCreate) -> ProjectTagPublic:
    """Create a project tag for a user."""
    name = _normalize_tag_name(payload.name)
    description = _normalize_tag_description(payload.description)
    color_hex = _normalize_tag_color(payload.color_hex)

    pool = get_pool()
    async with pool.acquire() as conn:
        try:
            row = await tags_repository.insert_user_tag(
                conn,
                user_id=user_id,
                name=name,
                description=description,
                color_hex=color_hex,
            )
        except UniqueViolationError as exc:
            raise AppError("Tag name already exists.", status_code=409) from exc

    return _record_to_tag(row)


async def update_project_tag(
    user_id: int,
    tag_id: int,
    payload: ProjectTagUpdate,
) -> ProjectTagPublic:
    """Update one project tag."""
    color_hex = (
        _normalize_tag_color(payload.color_hex)
        if payload.color_hex is not None
        else None
    )

    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await tags_repository.get_user_tag(conn, user_id=user_id, tag_id=tag_id)
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
            row = await tags_repository.update_user_tag(
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


async def delete_project_tag(user_id: int, tag_id: int) -> None:
    """Delete one project tag."""
    await deleted_service.trash_entity(
        user_id,
        deleted_entity_types.PROJECT_TAG,
        str(tag_id),
    )



# ----- Workspace canvas
DEFAULT_WORKSPACE_STATE: dict = {
    "version": 1,
    "viewport": {"x": 0, "y": 0, "zoom": 1},
    "nodes": [],
    "edges": [],
}


def _decode_jsonb_state(value: object) -> dict:
    """Decode a JSONB workspace state value to a dict."""
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        parsed = json.loads(value)
        if isinstance(parsed, dict):
            return parsed
    raise AppError("Invalid workspace state.", status_code=500)


def _record_to_workspace(row: asyncpg.Record) -> ProjectWorkspacePublic:
    """Map a database row to ProjectWorkspacePublic."""
    return ProjectWorkspacePublic(
        project_id=row["project_id"],
        canvas_id=row["canvas_id"],
        state=_decode_jsonb_state(row["state"]),
        settings=workspace_settings_service.settings_from_canvas_row(row),
        updated_at=row["updated_at"],
    )


async def _get_owned_canvas_row(
    conn: asyncpg.Connection,
    user_id: int,
    project_id: int,
    canvas_id: int,
) -> asyncpg.Record:
    """Return the owned canvas row or raise 404."""
    await _get_owned_project_row(conn, user_id, project_id)
    row = await canvas_repository.get_canvas_by_id(
        conn,
        project_id=project_id,
        canvas_id=canvas_id,
    )
    if row is None:
        raise AppError("Canvas not found.", status_code=404)
    return row


async def _load_workspace_for_canvas(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    project_id: int,
    canvas_id: int,
) -> ProjectWorkspacePublic:
    """Fetch and normalize workspace state for one canvas."""
    row = await _get_owned_canvas_row(conn, user_id, project_id, canvas_id)
    workspace = _record_to_workspace(row)
    cleaned = normalize_workspace_state(
        await _validate_workspace_media_refs(
            conn, user_id, project_id, workspace.state
        )
    )
    if cleaned != workspace.state:
        row = await canvas_repository.update_canvas_state(
            conn,
            project_id=project_id,
            canvas_id=canvas_id,
            state=cleaned,
        )
        return _record_to_workspace(row)
    return workspace


def _parse_media_node_id(raw: object) -> UUID | None:
    """Parse a canvas media node id as UUID."""
    if isinstance(raw, UUID):
        return raw
    if isinstance(raw, str):
        try:
            return UUID(raw)
        except ValueError:
            return None
    return None


async def _validate_workspace_media_refs(
    conn: asyncpg.Connection,
    user_id: int,
    project_id: int,
    state: dict,
) -> dict:
    """Strip media nodes whose media_id no longer belongs to the project gallery."""
    nodes = state.get("nodes")
    if not isinstance(nodes, list):
        return state

    _ = user_id
    gallery = await media_service.list_gallery_for_entity(
        conn,
        entity_type="project",
        entity_id=project_id,
    )
    valid_media_ids = {item.media.id for item in gallery}
    cover_attachment = await media_service.get_attachment_for_entity_role(
        conn,
        entity_type="project",
        entity_id=project_id,
        role="cover",
    )
    if cover_attachment is not None:
        valid_media_ids.add(cover_attachment.media.id)

    filtered_nodes = []
    removed_ids: set[str] = set()

    for node in nodes:
        if not isinstance(node, dict):
            filtered_nodes.append(node)
            continue
        if node.get("type") == "media":
            data = node.get("data")
            media_id = data.get("media_id") if isinstance(data, dict) else None
            parsed = _parse_media_node_id(media_id)
            if parsed is not None and parsed not in valid_media_ids:
                node_id = node.get("id")
                if isinstance(node_id, str):
                    removed_ids.add(node_id)
                continue
        filtered_nodes.append(node)

    if not removed_ids:
        return state

    edges = state.get("edges")
    filtered_edges = edges
    if isinstance(edges, list) and removed_ids:
        filtered_edges = [
            edge
            for edge in edges
            if isinstance(edge, dict)
            and edge.get("source") not in removed_ids
            and edge.get("target") not in removed_ids
        ]

    return {**state, "nodes": filtered_nodes, "edges": filtered_edges}


async def get_workspace(
    user_id: int,
    project_id: int,
    canvas_id: int,
) -> ProjectWorkspacePublic:
    """Fetch the workspace canvas state for one canvas."""
    pool = get_pool()
    async with pool.acquire() as conn:
        return await _load_workspace_for_canvas(
            conn,
            user_id=user_id,
            project_id=project_id,
            canvas_id=canvas_id,
        )


async def get_default_workspace(
    user_id: int,
    project_id: int,
) -> ProjectWorkspacePublic:
    """Fetch workspace state for the project's default canvas."""
    from . import canvases as canvases_service

    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_project_row(conn, user_id, project_id)
        canvas_id = await canvases_service.resolve_default_canvas_id(
            conn,
            user_id=user_id,
            project_id=project_id,
        )
        return await _load_workspace_for_canvas(
            conn,
            user_id=user_id,
            project_id=project_id,
            canvas_id=canvas_id,
        )


async def replace_workspace(
    user_id: int,
    project_id: int,
    canvas_id: int,
    state: dict,
) -> ProjectWorkspacePublic:
    """Replace the workspace canvas state for one canvas."""
    if not isinstance(state, dict):
        raise AppError("Workspace state must be an object.", status_code=422)

    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_canvas_row(conn, user_id, project_id, canvas_id)
        cleaned = normalize_workspace_state(
            await _validate_workspace_media_refs(
                conn, user_id, project_id, state
            )
        )
        row = await canvas_repository.update_canvas_state(
            conn,
            project_id=project_id,
            canvas_id=canvas_id,
            state=cleaned,
        )
    return _record_to_workspace(row)


async def replace_default_workspace(
    user_id: int,
    project_id: int,
    state: dict,
) -> ProjectWorkspacePublic:
    """Replace workspace state on the project's default canvas."""
    from . import canvases as canvases_service

    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_project_row(conn, user_id, project_id)
        canvas_id = await canvases_service.resolve_default_canvas_id(
            conn,
            user_id=user_id,
            project_id=project_id,
        )
    return await replace_workspace(user_id, project_id, canvas_id, state)


async def get_workspace_settings(
    user_id: int,
    project_id: int,
    canvas_id: int,
) -> ProjectWorkspaceSettingsPublic:
    """Fetch persisted workspace canvas UI settings for one canvas."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await _get_owned_canvas_row(conn, user_id, project_id, canvas_id)
        return workspace_settings_service.settings_from_canvas_row(row)


async def get_default_workspace_settings(
    user_id: int,
    project_id: int,
) -> ProjectWorkspaceSettingsPublic:
    """Fetch settings for the project's default canvas."""
    from . import canvases as canvases_service

    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_project_row(conn, user_id, project_id)
        canvas_id = await canvases_service.resolve_default_canvas_id(
            conn,
            user_id=user_id,
            project_id=project_id,
        )
        row = await canvas_repository.get_canvas_by_id(
            conn,
            project_id=project_id,
            canvas_id=canvas_id,
        )
        if row is None:
            raise AppError("Canvas not found.", status_code=404)
        return workspace_settings_service.settings_from_canvas_row(row)


async def update_workspace_settings(
    user_id: int,
    project_id: int,
    canvas_id: int,
    payload: ProjectWorkspaceSettingsUpdate,
) -> ProjectWorkspaceSettingsPublic:
    """Persist workspace canvas UI settings for one canvas."""
    settings = workspace_settings_service.validate_workspace_settings_payload(payload)
    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_canvas_row(conn, user_id, project_id, canvas_id)
        row = await canvas_repository.update_canvas_settings(
            conn,
            project_id=project_id,
            canvas_id=canvas_id,
            settings=workspace_settings_service.settings_to_storage(settings),
        )
    return workspace_settings_service.settings_from_canvas_row(row)


async def update_default_workspace_settings(
    user_id: int,
    project_id: int,
    payload: ProjectWorkspaceSettingsUpdate,
) -> ProjectWorkspaceSettingsPublic:
    """Persist settings on the project's default canvas."""
    from . import canvases as canvases_service

    pool = get_pool()
    async with pool.acquire() as conn:
        await _get_owned_project_row(conn, user_id, project_id)
        canvas_id = await canvases_service.resolve_default_canvas_id(
            conn,
            user_id=user_id,
            project_id=project_id,
        )
    return await update_workspace_settings(
        user_id,
        project_id,
        canvas_id,
        payload,
    )
