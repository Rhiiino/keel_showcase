# keel_api/src/modules/projects/service/workspace_settings.py

"""Per-project workspace canvas UI settings stored on project_canvas.settings."""

from __future__ import annotations

import json
from typing import Any

import asyncpg
from modules.projects import config
from modules.projects.schemas import (
    ProjectWorkspaceConfigPanelPosition,
    ProjectWorkspaceNotesGridPlacement,
    ProjectWorkspaceSettingsPublic,
    ProjectWorkspaceSettingsUpdate,
)



def default_workspace_settings(*, persisted: bool = False) -> ProjectWorkspaceSettingsPublic:
    return ProjectWorkspaceSettingsPublic(
        canvas_color=config.WORKSPACE_CANVAS_COLOR_DEFAULT,
        snap_enabled=config.WORKSPACE_SNAP_ENABLED_DEFAULT,
        minimap_open=config.WORKSPACE_MINIMAP_OPEN_DEFAULT,
        grid_dot_strength=config.WORKSPACE_GRID_DOT_STRENGTH_DEFAULT,
        config_open=True,
        config_position=ProjectWorkspaceConfigPanelPosition(
            x=config.WORKSPACE_CONFIG_POSITION_DEFAULT_X,
            y=config.WORKSPACE_CONFIG_POSITION_DEFAULT_Y,
        ),
        text_font_scale=config.WORKSPACE_TEXT_FONT_SCALE_DEFAULT,
        connection_style=config.WORKSPACE_CONNECTION_STYLE_DEFAULT,
        note_color_style=config.WORKSPACE_NOTE_COLOR_STYLE_DEFAULT,
        note_italic_color=config.WORKSPACE_NOTE_ITALIC_COLOR_DEFAULT,
        persisted=persisted,
    )


def _decode_jsonb_object(value: object) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return {}
        if isinstance(parsed, dict):
            return parsed
    return {}


def parse_config_panel_position(
    raw: object,
    *,
    default_x: float,
    default_y: float,
) -> ProjectWorkspaceConfigPanelPosition:
    data = raw if isinstance(raw, dict) else _decode_jsonb_object(raw)
    if not data:
        return ProjectWorkspaceConfigPanelPosition(x=default_x, y=default_y)
    x = data.get("x")
    y = data.get("y")
    if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
        return ProjectWorkspaceConfigPanelPosition(x=default_x, y=default_y)
    return ProjectWorkspaceConfigPanelPosition(x=float(x), y=float(y))


def normalize_canvas_color(value: str) -> str:
    if value in config.ALLOWED_WORKSPACE_CANVAS_COLORS:
        return value
    return config.WORKSPACE_CANVAS_COLOR_DEFAULT


def normalize_connection_style(value: str) -> str:
    if value in config.ALLOWED_WORKSPACE_CONNECTION_STYLES:
        return value
    return config.WORKSPACE_CONNECTION_STYLE_DEFAULT


def normalize_note_color_style(value: str) -> str:
    if value in config.ALLOWED_WORKSPACE_NOTE_COLOR_STYLES:
        return value
    return config.WORKSPACE_NOTE_COLOR_STYLE_DEFAULT


def normalize_note_italic_color(value: str) -> str:
    if value in config.ALLOWED_WORKSPACE_NOTE_ITALIC_COLORS:
        return value
    return config.WORKSPACE_NOTE_ITALIC_COLOR_DEFAULT


def normalize_text_font_scale(value: object) -> float:
    if not isinstance(value, (int, float)):
        return config.WORKSPACE_TEXT_FONT_SCALE_DEFAULT
    numeric = float(value)
    return max(
        config.WORKSPACE_TEXT_FONT_SCALE_MIN,
        min(config.WORKSPACE_TEXT_FONT_SCALE_MAX, numeric),
    )


def normalize_grid_dot_strength(value: object) -> float:
    if not isinstance(value, (int, float)):
        return config.WORKSPACE_GRID_DOT_STRENGTH_DEFAULT
    numeric = float(value)
    return max(
        config.WORKSPACE_GRID_DOT_STRENGTH_MIN,
        min(config.WORKSPACE_GRID_DOT_STRENGTH_MAX, numeric),
    )


def normalize_notes_grid_layout(raw: object) -> list[ProjectWorkspaceNotesGridPlacement] | None:
    if not isinstance(raw, list) or len(raw) == 0:
        return None

    parsed: list[ProjectWorkspaceNotesGridPlacement] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        note_id = item.get("id")
        grid_x = item.get("grid_x")
        grid_y = item.get("grid_y")
        col_span = item.get("col_span")
        row_span = item.get("row_span")
        if (
            not isinstance(note_id, str)
            or not isinstance(grid_x, (int, float))
            or not isinstance(grid_y, (int, float))
            or not isinstance(col_span, (int, float))
            or not isinstance(row_span, (int, float))
        ):
            continue
        grid_x_int = int(grid_x)
        grid_y_int = int(grid_y)
        col_span_int = int(col_span)
        row_span_int = int(row_span)
        if col_span_int < 1 or row_span_int < 1 or grid_x_int < 0 or grid_y_int < 0:
            continue
        parsed.append(
            ProjectWorkspaceNotesGridPlacement(
                id=note_id,
                grid_x=grid_x_int,
                grid_y=grid_y_int,
                col_span=col_span_int,
                row_span=row_span_int,
            ),
        )

    return parsed or None


def settings_from_storage(raw: object, *, persisted: bool) -> ProjectWorkspaceSettingsPublic:
    data = _decode_jsonb_object(raw)
    if not persisted:
        return default_workspace_settings(persisted=False)

    return ProjectWorkspaceSettingsPublic(
        canvas_color=normalize_canvas_color(str(data.get("canvas_color", config.WORKSPACE_CANVAS_COLOR_DEFAULT))),
        snap_enabled=bool(data.get("snap_enabled", config.WORKSPACE_SNAP_ENABLED_DEFAULT)),
        minimap_open=bool(data.get("minimap_open", config.WORKSPACE_MINIMAP_OPEN_DEFAULT)),
        grid_dot_strength=normalize_grid_dot_strength(
            data.get("grid_dot_strength", config.WORKSPACE_GRID_DOT_STRENGTH_DEFAULT),
        ),
        config_open=bool(data.get("config_open", True)),
        config_position=parse_config_panel_position(
            data.get("config_position"),
            default_x=config.WORKSPACE_CONFIG_POSITION_DEFAULT_X,
            default_y=config.WORKSPACE_CONFIG_POSITION_DEFAULT_Y,
        ),
        text_font_scale=normalize_text_font_scale(
            data.get("text_font_scale", config.WORKSPACE_TEXT_FONT_SCALE_DEFAULT),
        ),
        connection_style=normalize_connection_style(
            str(data.get("connection_style", config.WORKSPACE_CONNECTION_STYLE_DEFAULT)),
        ),
        note_color_style=normalize_note_color_style(
            str(data.get("note_color_style", config.WORKSPACE_NOTE_COLOR_STYLE_DEFAULT)),
        ),
        note_italic_color=normalize_note_italic_color(
            str(data.get("note_italic_color", config.WORKSPACE_NOTE_ITALIC_COLOR_DEFAULT)),
        ),
        notes_grid_layout=normalize_notes_grid_layout(data.get("notes_grid_layout")),
        persisted=True,
    )


def validate_workspace_settings_payload(
    payload: ProjectWorkspaceSettingsUpdate,
) -> ProjectWorkspaceSettingsPublic:
    return ProjectWorkspaceSettingsPublic(
        canvas_color=normalize_canvas_color(payload.canvas_color),
        snap_enabled=payload.snap_enabled,
        minimap_open=payload.minimap_open,
        grid_dot_strength=normalize_grid_dot_strength(payload.grid_dot_strength),
        config_open=payload.config_open,
        config_position=ProjectWorkspaceConfigPanelPosition(
            x=float(payload.config_position.x),
            y=float(payload.config_position.y),
        ),
        text_font_scale=normalize_text_font_scale(payload.text_font_scale),
        connection_style=normalize_connection_style(payload.connection_style),
        note_color_style=normalize_note_color_style(payload.note_color_style),
        note_italic_color=normalize_note_italic_color(payload.note_italic_color),
        notes_grid_layout=normalize_notes_grid_layout(payload.notes_grid_layout),
        persisted=True,
    )


def settings_to_storage(settings: ProjectWorkspaceSettingsPublic) -> dict[str, Any]:
    return {
        "canvas_color": settings.canvas_color,
        "snap_enabled": settings.snap_enabled,
        "minimap_open": settings.minimap_open,
        "grid_dot_strength": settings.grid_dot_strength,
        "config_open": settings.config_open,
        "config_position": {
            "x": settings.config_position.x,
            "y": settings.config_position.y,
        },
        "text_font_scale": settings.text_font_scale,
        "connection_style": settings.connection_style,
        "note_color_style": settings.note_color_style,
        "note_italic_color": settings.note_italic_color,
    }
    if settings.notes_grid_layout:
        storage["notes_grid_layout"] = [
            {
                "id": item.id,
                "grid_x": item.grid_x,
                "grid_y": item.grid_y,
                "col_span": item.col_span,
                "row_span": item.row_span,
            }
            for item in settings.notes_grid_layout
        ]
    return storage


def settings_persisted(raw: object) -> bool:
    data = _decode_jsonb_object(raw)
    return bool(data)


def settings_from_canvas_row(row: asyncpg.Record | None) -> ProjectWorkspaceSettingsPublic:
    if row is None:
        return default_workspace_settings(persisted=False)
    return settings_from_storage(
        row["settings"],
        persisted=settings_persisted(row["settings"]),
    )
