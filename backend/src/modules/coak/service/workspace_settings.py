# keel_api/src/modules/coak/service/workspace_settings.py

"""Per-record Coak panel layout settings on coak_records."""

from __future__ import annotations

from core.database import get_pool
from core.errors import AppError
from modules.coak.repository import records as records_repository
from modules.coak.schemas import (
    CoakPanelRect,
    CoakWorkspaceSettingsPublic,
    CoakWorkspaceSettingsUpdate,
    CoakWorkspaceWindow,
)
from modules.coak.service.helpers import assert_owned_record

_VALID_PANEL_IDS = frozenset({"constellation", "directory"})
_VALID_TAB_IDS = frozenset({"constellation", "general", "directory", "settings"})
_LEGACY_PANEL_ID_MAP = {"focus": "constellation"}
_DEFAULT_PANEL_ORDER = ["constellation", "directory"]



def empty_workspace_settings(*, persisted: bool = False) -> CoakWorkspaceSettingsPublic:
    return CoakWorkspaceSettingsPublic(
        panels={},
        panel_order=list(_DEFAULT_PANEL_ORDER),
        windows=[],
        window_order=[],
        persisted=persisted,
    )


def normalize_panel_id(panel_id: str) -> str | None:
    if panel_id in _VALID_PANEL_IDS:
        return panel_id
    return _LEGACY_PANEL_ID_MAP.get(panel_id)


def normalize_tab_id(tab_id: str) -> str | None:
    if tab_id in _VALID_TAB_IDS:
        return tab_id
    return None


def parse_panel_rect(raw: object) -> CoakPanelRect | None:
    if not isinstance(raw, dict):
        return None
    x = raw.get("x")
    y = raw.get("y")
    width = raw.get("width")
    height = raw.get("height")
    z_index = raw.get("z_index", 1)
    if not all(isinstance(value, (int, float)) for value in (x, y, width, height)):
        return None
    if float(width) < 0 or float(height) < 0:
        return None
    if not isinstance(z_index, int):
        z_index = 1
    return CoakPanelRect(
        x=float(x),
        y=float(y),
        width=float(width),
        height=float(height),
        z_index=z_index,
    )


def parse_panels(raw: object) -> dict[str, CoakPanelRect]:
    if not isinstance(raw, dict):
        return {}
    panels: dict[str, CoakPanelRect] = {}
    for panel_id, panel_raw in raw.items():
        if not isinstance(panel_id, str):
            continue
        normalized_id = normalize_panel_id(panel_id)
        if normalized_id is None:
            continue
        parsed = parse_panel_rect(panel_raw)
        if parsed is not None:
            panels[normalized_id] = parsed
    return panels


def parse_panel_order(raw: object) -> list[str]:
    if not isinstance(raw, list):
        return list(_DEFAULT_PANEL_ORDER)
    order: list[str] = []
    for item in raw:
        if not isinstance(item, str):
            continue
        normalized_id = normalize_panel_id(item)
        if normalized_id is None or normalized_id in order:
            continue
        order.append(normalized_id)
    for panel_id in _DEFAULT_PANEL_ORDER:
        if panel_id not in order:
            order.append(panel_id)
    return order


def parse_window(raw: object) -> CoakWorkspaceWindow | None:
    if not isinstance(raw, dict):
        return None
    window_id = raw.get("id")
    if not isinstance(window_id, str) or not window_id:
        return None

    rect = parse_panel_rect(raw.get("rect"))
    if rect is None:
        return None

    tabs_raw = raw.get("tabs")
    if not isinstance(tabs_raw, list):
        return None

    tabs: list[str] = []
    for tab in tabs_raw:
        if not isinstance(tab, str):
            continue
        normalized_tab = normalize_tab_id(tab)
        if normalized_tab is None or normalized_tab in tabs:
            continue
        tabs.append(normalized_tab)
    if not tabs:
        return None

    active_raw = raw.get("active_tab")
    active_tab = active_raw if isinstance(active_raw, str) and active_raw in tabs else tabs[0]

    return CoakWorkspaceWindow(
        id=window_id,
        rect=rect,
        tabs=tabs,
        active_tab=active_tab,
    )


def parse_windows(raw: object) -> list[CoakWorkspaceWindow]:
    if not isinstance(raw, list):
        return []
    windows: list[CoakWorkspaceWindow] = []
    for item in raw:
        parsed = parse_window(item)
        if parsed is not None:
            windows.append(parsed)
    return windows


def parse_window_order(raw: object, windows: list[CoakWorkspaceWindow]) -> list[str]:
    window_ids = {window.id for window in windows}
    order: list[str] = []
    if isinstance(raw, list):
        for item in raw:
            if isinstance(item, str) and item in window_ids and item not in order:
                order.append(item)
    for window in windows:
        if window.id not in order:
            order.append(window.id)
    return order


def workspace_settings_from_record_data(raw: object) -> CoakWorkspaceSettingsPublic:
    if not isinstance(raw, dict):
        return empty_workspace_settings()
    windows = parse_windows(raw.get("windows"))
    panels = parse_panels(raw.get("panels"))
    has_layout = len(windows) > 0 or len(panels) > 0
    return CoakWorkspaceSettingsPublic(
        panels=panels,
        panel_order=parse_panel_order(raw.get("panel_order")),
        windows=windows,
        window_order=parse_window_order(raw.get("window_order"), windows),
        persisted=has_layout,
    )


async def get_workspace_settings(user_id: int, record_id: int) -> CoakWorkspaceSettingsPublic:
    pool = get_pool()
    async with pool.acquire() as conn:
        await assert_owned_record(conn, user_id=user_id, record_id=record_id)
        record_data = await records_repository.get_workspace_settings(
            conn,
            user_id=user_id,
            record_id=record_id,
        )
    if record_data is None:
        return empty_workspace_settings(persisted=False)
    return workspace_settings_from_record_data(record_data)


async def update_workspace_settings(
    user_id: int,
    record_id: int,
    payload: CoakWorkspaceSettingsUpdate,
) -> CoakWorkspaceSettingsPublic:
    panels: dict[str, CoakPanelRect] = {}
    for panel_id, panel in payload.panels.items():
        normalized_id = normalize_panel_id(panel_id)
        if normalized_id is not None:
            panels[normalized_id] = panel

    windows = parse_windows([window.model_dump() for window in payload.windows])

    settings = CoakWorkspaceSettingsPublic(
        panels=panels,
        panel_order=parse_panel_order(payload.panel_order),
        windows=windows,
        window_order=parse_window_order(payload.window_order, windows),
        persisted=True,
    )
    serialized = {
        "windows": [
            {
                "id": window.id,
                "rect": {
                    "x": window.rect.x,
                    "y": window.rect.y,
                    "width": window.rect.width,
                    "height": window.rect.height,
                    "z_index": window.rect.z_index,
                },
                "tabs": list(window.tabs),
                "active_tab": window.active_tab,
            }
            for window in settings.windows
        ],
        "window_order": list(settings.window_order),
    }

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await assert_owned_record(conn, user_id=user_id, record_id=record_id)
            updated = await records_repository.update_workspace_settings(
                conn,
                user_id=user_id,
                record_id=record_id,
                workspace_settings=serialized,
            )
            if updated is None:
                raise AppError("Coak record not found.", status_code=404)

    return settings
