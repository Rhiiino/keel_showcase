# keel_api/src/modules/focus/service/constellation_settings.py

"""Constellation visual settings persisted in user preferences."""

from __future__ import annotations

from typing import Any

import asyncpg

from core.database import get_pool
from core.errors import AppError
from modules.focus import config
from modules.focus.schemas import (
    FocusConstellationConfigPanelPosition,
    FocusConstellationSettingsPublic,
    FocusConstellationSettingsUpdate,
)
from modules.focus.service.helpers import decode_preferences_data
from modules.settings import repository as settings_repository



def default_constellation_settings(*, persisted: bool = False) -> FocusConstellationSettingsPublic:
    return FocusConstellationSettingsPublic(
        node_shape="circle",
        canvas_tone="slate",
        connection_color="silver",
        connection_style="flexible",
        list_node_style="glass",
        label_font_key=config.DEFAULT_TITLE_FONT_KEY,
        node_size_multiplier=config.CONSTELLATION_NODE_SIZE_MULTIPLIER_DEFAULT,
        title_size_px=config.CONSTELLATION_TITLE_SIZE_DEFAULT,
        unlink_distance_multiplier=config.CONSTELLATION_UNLINK_DISTANCE_DEFAULT,
        config_open=True,
        config_position=FocusConstellationConfigPanelPosition(
            x=config.CONSTELLATION_CONFIG_POSITION_DEFAULT_X,
            y=config.CONSTELLATION_CONFIG_POSITION_DEFAULT_Y,
        ),
        notes_panel_position=FocusConstellationConfigPanelPosition(
            x=config.CONSTELLATION_NOTES_PANEL_POSITION_DEFAULT_X,
            y=config.CONSTELLATION_NOTES_PANEL_POSITION_DEFAULT_Y,
        ),
        node_info_enabled=True,
        persisted=persisted,
    )


def normalize_list_node_style(value: str) -> str:
    if value == "wood":
        return "matte"
    if value in {"frosted", "neon"}:
        return "glass"
    if value in config.ALLOWED_CONSTELLATION_LIST_NODE_STYLES:
        return value
    return "glass"


def normalize_canvas_tone(value: str) -> str:
    if value == "glow":
        return "ocean"
    if value == "light":
        return "black"
    if value in config.ALLOWED_CONSTELLATION_CANVAS_TONES:
        return value
    return "slate"


def clamp_constellation_node_size_multiplier(value: float) -> float:
    rounded = round(value / 0.05) * 0.05
    return min(
        config.CONSTELLATION_NODE_SIZE_MULTIPLIER_MAX,
        max(config.CONSTELLATION_NODE_SIZE_MULTIPLIER_MIN, rounded),
    )


def clamp_constellation_title_size(value: int) -> int:
    return min(
        config.CONSTELLATION_TITLE_SIZE_MAX,
        max(config.CONSTELLATION_TITLE_SIZE_MIN, int(value)),
    )


def clamp_constellation_unlink_distance(value: float) -> float:
    rounded = round(value / 0.1) * 0.1
    return min(
        config.CONSTELLATION_UNLINK_DISTANCE_MAX,
        max(config.CONSTELLATION_UNLINK_DISTANCE_MIN, rounded),
    )


def parse_constellation_panel_position(
    raw: object,
    *,
    default_x: float,
    default_y: float,
) -> FocusConstellationConfigPanelPosition:
    if not isinstance(raw, dict):
        return FocusConstellationConfigPanelPosition(x=default_x, y=default_y)
    x = raw.get("x")
    y = raw.get("y")
    if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
        return FocusConstellationConfigPanelPosition(x=default_x, y=default_y)
    return FocusConstellationConfigPanelPosition(x=float(x), y=float(y))


def parse_constellation_config_position(
    raw: object,
) -> FocusConstellationConfigPanelPosition:
    return parse_constellation_panel_position(
        raw,
        default_x=config.CONSTELLATION_CONFIG_POSITION_DEFAULT_X,
        default_y=config.CONSTELLATION_CONFIG_POSITION_DEFAULT_Y,
    )


def parse_constellation_notes_panel_position(
    raw: object,
) -> FocusConstellationConfigPanelPosition:
    return parse_constellation_panel_position(
        raw,
        default_x=config.CONSTELLATION_NOTES_PANEL_POSITION_DEFAULT_X,
        default_y=config.CONSTELLATION_NOTES_PANEL_POSITION_DEFAULT_Y,
    )


def constellation_settings_from_preferences_data(
    data: dict[str, Any],
) -> FocusConstellationSettingsPublic:
    focus_data = data.get(config.PREFERENCES_FOCUS_KEY)
    if not isinstance(focus_data, dict):
        return default_constellation_settings()

    settings_data = focus_data.get(config.PREFERENCES_CONSTELLATION_SETTINGS_KEY)
    if not isinstance(settings_data, dict):
        return default_constellation_settings()

    node_shape = settings_data.get("node_shape")
    canvas_tone = settings_data.get("canvas_tone")
    connection_color = settings_data.get("connection_color")
    connection_style = settings_data.get("connection_style")
    list_node_style = settings_data.get("list_node_style")
    label_font_key = settings_data.get("label_font_key")
    node_size_multiplier = settings_data.get("node_size_multiplier")
    title_size_px = settings_data.get("title_size_px")
    unlink_distance_multiplier = settings_data.get("unlink_distance_multiplier")
    config_open = settings_data.get("config_open")
    node_info_enabled = settings_data.get("node_info_enabled")

    return FocusConstellationSettingsPublic(
        node_shape=(
            node_shape
            if isinstance(node_shape, str)
            and node_shape in config.ALLOWED_CONSTELLATION_NODE_SHAPES
            else "circle"
        ),
        canvas_tone=(
            normalize_canvas_tone(canvas_tone)
            if isinstance(canvas_tone, str)
            else "slate"
        ),
        connection_color=(
            connection_color
            if isinstance(connection_color, str)
            and connection_color in config.ALLOWED_CONSTELLATION_CONNECTION_COLORS
            else "silver"
        ),
        connection_style=(
            connection_style
            if isinstance(connection_style, str)
            and connection_style in config.ALLOWED_CONSTELLATION_CONNECTION_STYLES
            else "flexible"
        ),
        list_node_style=(
            normalize_list_node_style(list_node_style)
            if isinstance(list_node_style, str)
            else "glass"
        ),
        label_font_key=(
            label_font_key
            if isinstance(label_font_key, str)
            and label_font_key in config.ALLOWED_TITLE_FONT_KEYS
            else config.DEFAULT_TITLE_FONT_KEY
        ),
        node_size_multiplier=(
            clamp_constellation_node_size_multiplier(float(node_size_multiplier))
            if isinstance(node_size_multiplier, (int, float))
            else config.CONSTELLATION_NODE_SIZE_MULTIPLIER_DEFAULT
        ),
        title_size_px=(
            clamp_constellation_title_size(int(title_size_px))
            if isinstance(title_size_px, (int, float))
            else config.CONSTELLATION_TITLE_SIZE_DEFAULT
        ),
        unlink_distance_multiplier=(
            clamp_constellation_unlink_distance(float(unlink_distance_multiplier))
            if isinstance(unlink_distance_multiplier, (int, float))
            else config.CONSTELLATION_UNLINK_DISTANCE_DEFAULT
        ),
        config_open=config_open if isinstance(config_open, bool) else True,
        config_position=parse_constellation_config_position(
            settings_data.get("config_position"),
        ),
        notes_panel_position=parse_constellation_notes_panel_position(
            settings_data.get("notes_panel_position"),
        ),
        node_info_enabled=(
            node_info_enabled if isinstance(node_info_enabled, bool) else True
        ),
        persisted=True,
    )


def validate_constellation_settings_payload(
    payload: FocusConstellationSettingsUpdate,
) -> FocusConstellationSettingsPublic:
    if payload.node_shape not in config.ALLOWED_CONSTELLATION_NODE_SHAPES:
        raise AppError("Invalid constellation node shape.", status_code=400)
    if payload.canvas_tone not in config.ALLOWED_CONSTELLATION_CANVAS_TONES:
        raise AppError("Invalid constellation canvas tone.", status_code=400)
    if payload.connection_color not in config.ALLOWED_CONSTELLATION_CONNECTION_COLORS:
        raise AppError("Invalid constellation connection color.", status_code=400)
    if payload.connection_style not in config.ALLOWED_CONSTELLATION_CONNECTION_STYLES:
        raise AppError("Invalid constellation connection style.", status_code=400)
    if payload.list_node_style not in config.ALLOWED_CONSTELLATION_LIST_NODE_STYLES:
        raise AppError("Invalid constellation list node style.", status_code=400)
    if payload.label_font_key not in config.ALLOWED_TITLE_FONT_KEYS:
        raise AppError("Invalid constellation label font.", status_code=400)

    return FocusConstellationSettingsPublic(
        node_shape=payload.node_shape,
        canvas_tone=payload.canvas_tone,
        connection_color=payload.connection_color,
        connection_style=payload.connection_style,
        list_node_style=payload.list_node_style,
        label_font_key=payload.label_font_key,
        node_size_multiplier=clamp_constellation_node_size_multiplier(
            payload.node_size_multiplier,
        ),
        title_size_px=clamp_constellation_title_size(payload.title_size_px),
        unlink_distance_multiplier=clamp_constellation_unlink_distance(
            payload.unlink_distance_multiplier,
        ),
        config_open=payload.config_open,
        config_position=FocusConstellationConfigPanelPosition(
            x=float(payload.config_position.x),
            y=float(payload.config_position.y),
        ),
        notes_panel_position=FocusConstellationConfigPanelPosition(
            x=float(payload.notes_panel_position.x),
            y=float(payload.notes_panel_position.y),
        ),
        node_info_enabled=payload.node_info_enabled,
        persisted=True,
    )


async def read_constellation_settings(
    conn: asyncpg.Connection,
    user_id: int,
) -> FocusConstellationSettingsPublic:
    row = await settings_repository.get_user_preferences(conn, user_id)
    data = decode_preferences_data(row["data"] if row is not None else None)
    return constellation_settings_from_preferences_data(data)


async def write_constellation_settings(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    settings: FocusConstellationSettingsPublic,
) -> None:
    row = await settings_repository.get_user_preferences(conn, user_id)
    data = decode_preferences_data(row["data"] if row is not None else None)
    focus_data = dict(data.get("focus", {})) if isinstance(data.get("focus"), dict) else {}
    focus_data[config.PREFERENCES_CONSTELLATION_SETTINGS_KEY] = {
        "node_shape": settings.node_shape,
        "canvas_tone": settings.canvas_tone,
        "connection_color": settings.connection_color,
        "connection_style": settings.connection_style,
        "list_node_style": settings.list_node_style,
        "label_font_key": settings.label_font_key,
        "node_size_multiplier": settings.node_size_multiplier,
        "title_size_px": settings.title_size_px,
        "unlink_distance_multiplier": settings.unlink_distance_multiplier,
        "config_open": settings.config_open,
        "config_position": {
            "x": settings.config_position.x,
            "y": settings.config_position.y,
        },
        "notes_panel_position": {
            "x": settings.notes_panel_position.x,
            "y": settings.notes_panel_position.y,
        },
        "node_info_enabled": settings.node_info_enabled,
    }
    data["focus"] = focus_data
    await settings_repository.upsert_user_preferences(conn, user_id=user_id, data=data)


async def get_constellation_settings(user_id: int) -> FocusConstellationSettingsPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        return await read_constellation_settings(conn, user_id)


async def update_constellation_settings(
    user_id: int,
    payload: FocusConstellationSettingsUpdate,
) -> FocusConstellationSettingsPublic:
    settings = validate_constellation_settings_payload(payload)
    pool = get_pool()
    async with pool.acquire() as conn:
        await write_constellation_settings(conn, user_id=user_id, settings=settings)
    return settings
