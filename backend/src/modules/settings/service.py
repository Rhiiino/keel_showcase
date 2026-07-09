# keel_api/src/modules/settings/service.py
"""Business logic for per-user cross-frontend UI settings."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

import asyncpg

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from core.database import get_pool
from core.errors import AppError
from modules.media import config as media_config
from modules.media import service as media_service
from modules.settings import config, repository
from modules.settings.schemas import UserSettingsPatch, UserSettingsPublic


# ----- Helpers
def _decode_jsonb_data(value: object) -> dict[str, Any]:
    if value is None:
        return {}
    if isinstance(value, dict):
        return dict(value)
    if isinstance(value, str):
        parsed = json.loads(value)
        if isinstance(parsed, dict):
            return parsed
    raise ValueError("Settings data must be a JSON object.")


def _row_to_public(row: asyncpg.Record | None) -> UserSettingsPublic:
    if row is None:
        return UserSettingsPublic(data={}, updated_at=datetime.now(UTC))

    return UserSettingsPublic(
        data=_decode_jsonb_data(row["data"]),
        updated_at=row["updated_at"],
    )


def _normalize_home_quote_interval_seconds(value: int | None) -> int | None:
    if value is None:
        return None
    if (
        value < config.MIN_HOME_QUOTE_INTERVAL_SECONDS
        or value > config.MAX_HOME_QUOTE_INTERVAL_SECONDS
    ):
        raise AppError(
            "home_quote_interval_seconds must be between "
            f"{config.MIN_HOME_QUOTE_INTERVAL_SECONDS} and "
            f"{config.MAX_HOME_QUOTE_INTERVAL_SECONDS}.",
            status_code=400,
        )
    if value == config.DEFAULT_HOME_QUOTE_INTERVAL_SECONDS:
        return None
    return value


def _normalize_nav_breadcrumb_max_entries(value: int | None) -> int | None:
    if value is None:
        return None
    if (
        value < config.MIN_NAV_BREADCRUMB_MAX_ENTRIES
        or value > config.MAX_NAV_BREADCRUMB_MAX_ENTRIES
    ):
        raise AppError(
            "nav_breadcrumb_max_entries must be between "
            f"{config.MIN_NAV_BREADCRUMB_MAX_ENTRIES} and "
            f"{config.MAX_NAV_BREADCRUMB_MAX_ENTRIES}.",
            status_code=400,
        )
    if value == config.DEFAULT_NAV_BREADCRUMB_MAX_ENTRIES:
        return None
    return value


def _normalize_timezone(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    if not normalized:
        return None
    try:
        ZoneInfo(normalized)
    except ZoneInfoNotFoundError as exc:
        raise AppError(f"Invalid timezone: {normalized}", status_code=400) from exc
    return normalized


def _normalize_greeting_font_key(font_key: str | None) -> str | None:
    if font_key is None:
        return None
    normalized = font_key.strip().lower()
    if not normalized or normalized == config.DEFAULT_GREETING_FONT_KEY:
        return None
    if normalized not in config.ALLOWED_GREETING_FONT_KEYS:
        allowed = ", ".join(sorted(config.ALLOWED_GREETING_FONT_KEYS))
        raise AppError(
            f"home_greeting_font_key must be one of: {allowed}.",
            status_code=400,
        )
    return normalized


def _normalize_home_greeting_font_size_px(value: int | None) -> int | None:
    if value is None:
        return None
    if (
        value < config.MIN_HOME_GREETING_FONT_SIZE_PX
        or value > config.MAX_HOME_GREETING_FONT_SIZE_PX
    ):
        raise AppError(
            "home_greeting_font_size_px must be between "
            f"{config.MIN_HOME_GREETING_FONT_SIZE_PX} and "
            f"{config.MAX_HOME_GREETING_FONT_SIZE_PX}.",
            status_code=400,
        )
    if value == config.DEFAULT_HOME_GREETING_FONT_SIZE_PX:
        return None
    return value


def _merge_shell_background(
    existing: dict[str, Any],
    patch: dict[str, Any] | None,
) -> dict[str, Any] | None:
    if patch is None:
        return None
    current = existing.get("shell_background")
    merged = dict(current) if isinstance(current, dict) else {}
    for key, value in patch.items():
        if key == "media_id" and value is None:
            merged["media_id"] = None
            merged.pop("media_updated_at", None)
            continue
        if value is None:
            continue
        merged[key] = value
    if not merged.get("media_id"):
        merged["enabled"] = False
    return merged


async def _normalize_shell_background(
    user_id: int,
    value: object,
) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None

    enabled = bool(value.get("enabled", config.DEFAULT_SHELL_BACKGROUND_ENABLED))
    media_id_raw = value.get("media_id")
    media_updated_at = value.get("media_updated_at")

    if media_id_raw is None:
        if not enabled:
            return None
        return {
            "enabled": False,
            "media_id": None,
        }

    try:
        media_id = UUID(str(media_id_raw))
    except ValueError as exc:
        raise AppError(
            "shell_background.media_id must be a valid UUID.",
            status_code=400,
        ) from exc

    media = await media_service.get_media_metadata(user_id, media_id)
    if media.mime_type not in media_config.ALLOWED_IMAGE_MIME_TYPES:
        raise AppError(
            "shell_background.media_id must reference an image.",
            status_code=400,
        )

    normalized_updated_at = (
        str(media_updated_at).strip()
        if isinstance(media_updated_at, str) and media_updated_at.strip()
        else media.updated_at.isoformat()
    )

    return {
        "enabled": enabled,
        "media_id": str(media.id),
        "media_updated_at": normalized_updated_at,
    }


def _normalize_home_slideshow_interval_seconds(value: int | None) -> int | None:
    if value is None:
        return None
    if (
        value < config.MIN_HOME_SLIDESHOW_INTERVAL_SECONDS
        or value > config.MAX_HOME_SLIDESHOW_INTERVAL_SECONDS
    ):
        raise AppError(
            "home_slideshow.interval_seconds must be between "
            f"{config.MIN_HOME_SLIDESHOW_INTERVAL_SECONDS} and "
            f"{config.MAX_HOME_SLIDESHOW_INTERVAL_SECONDS}.",
            status_code=400,
        )
    if value == config.DEFAULT_HOME_SLIDESHOW_INTERVAL_SECONDS:
        return None
    return value


def _merge_home_slideshow(
    existing: dict[str, Any],
    patch: dict[str, Any] | None,
) -> dict[str, Any] | None:
    if patch is None:
        return None
    current = existing.get("home_slideshow")
    merged = dict(current) if isinstance(current, dict) else {}
    for key, value in patch.items():
        if key == "paused" and value is False:
            merged.pop("paused", None)
            merged.pop("paused_media_id", None)
            continue
        if value is None:
            continue
        merged[key] = value
    return merged


async def _normalize_home_slideshow(
    user_id: int,
    value: object,
) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None

    interval_seconds = _normalize_home_slideshow_interval_seconds(
        value.get("interval_seconds")
        if isinstance(value.get("interval_seconds"), int)
        else None,
    )

    raw_ids = value.get("media_ids")
    if raw_ids is None:
        raw_ids = []
    if not isinstance(raw_ids, list):
        raise AppError(
            "home_slideshow.media_ids must be a list of UUID strings.",
            status_code=400,
        )

    if len(raw_ids) > config.MAX_HOME_SLIDESHOW_MEDIA_IDS:
        raise AppError(
            f"home_slideshow.media_ids may contain at most "
            f"{config.MAX_HOME_SLIDESHOW_MEDIA_IDS} items.",
            status_code=400,
        )

    normalized_ids: list[str] = []
    seen: set[str] = set()
    for raw_id in raw_ids:
        try:
            media_id = UUID(str(raw_id))
        except ValueError as exc:
            raise AppError(
                "home_slideshow.media_ids must contain valid UUID strings.",
                status_code=400,
            ) from exc

        media_id_str = str(media_id)
        if media_id_str in seen:
            continue
        seen.add(media_id_str)

        try:
            media = await media_service.get_media_metadata(user_id, media_id)
        except AppError:
            continue

        if media.mime_type not in media_config.ALLOWED_IMAGE_MIME_TYPES:
            continue

        normalized_ids.append(media_id_str)

    if not normalized_ids:
        return None

    paused = bool(value.get("paused", False))
    paused_media_id_raw = value.get("paused_media_id")
    paused_media_id: str | None = None
    if (
        paused
        and isinstance(paused_media_id_raw, str)
        and paused_media_id_raw.strip() in normalized_ids
    ):
        paused_media_id = paused_media_id_raw.strip()

    result: dict[str, Any] = {"media_ids": normalized_ids}
    if interval_seconds is not None:
        result["interval_seconds"] = interval_seconds
    if paused:
        result["paused"] = True
        if paused_media_id:
            result["paused_media_id"] = paused_media_id
    return result


def _normalize_home_card_layout(value: object) -> list[dict[str, Any]] | None:
    if not isinstance(value, list):
        return None
    if not value:
        return None

    normalized: list[dict[str, Any]] = []
    seen: set[str] = set()
    for entry in value:
        if not isinstance(entry, dict):
            continue
        card_id = entry.get("id")
        if not isinstance(card_id, str) or card_id not in config.ALLOWED_HOME_CARD_IDS:
            continue
        if card_id in seen:
            continue
        seen.add(card_id)

        x_raw = entry.get("x", 0)
        y_raw = entry.get("y", 0)
        if not isinstance(x_raw, (int, float)) or not isinstance(y_raw, (int, float)):
            continue

        normalized_entry: dict[str, Any] = {
            "id": card_id,
            "x": round(
                max(0, min(config.MAX_HOME_CARD_LAYOUT_COORD, float(x_raw))),
                1,
            ),
            "y": round(
                max(0, min(config.MAX_HOME_CARD_LAYOUT_COORD, float(y_raw))),
                1,
            ),
        }

        if card_id in config.RESIZABLE_HOME_CARD_IDS:
            width_raw = entry.get("width")
            height_raw = entry.get("height")
            if isinstance(width_raw, (int, float)):
                normalized_entry["width"] = round(
                    max(
                        config.MIN_HOME_CARD_WIDTH,
                        min(config.MAX_HOME_CARD_WIDTH, float(width_raw)),
                    ),
                    1,
                )
            if isinstance(height_raw, (int, float)):
                normalized_entry["height"] = round(
                    max(
                        config.MIN_HOME_CARD_HEIGHT,
                        min(config.MAX_HOME_CARD_HEIGHT, float(height_raw)),
                    ),
                    1,
                )

        normalized.append(normalized_entry)

    if not normalized:
        return None
    return normalized


def _merge_nav_menu_visibility(
    existing: dict[str, Any],
    patch: dict[str, Any] | None,
) -> dict[str, bool] | None:
    if patch is None:
        return None
    current = existing.get("nav_menu_visibility")
    merged: dict[str, bool] = dict(current) if isinstance(current, dict) else {}
    for key, value in patch.items():
        if not isinstance(key, str) or not key:
            continue
        if value is False:
            merged[key] = False
        elif value is True:
            merged.pop(key, None)
    return merged if merged else None


def _normalize_nav_menu_visibility(value: object) -> dict[str, bool] | None:
    if not isinstance(value, dict):
        return None
    normalized: dict[str, bool] = {}
    for key, visible in value.items():
        if not isinstance(key, str) or not key:
            continue
        if visible is False:
            normalized[key] = False
    return normalized if normalized else None


def _merge_home_card_visibility(
    existing: dict[str, Any],
    patch: dict[str, Any] | None,
) -> dict[str, bool] | None:
    if patch is None:
        return None
    current = existing.get("home_card_visibility")
    merged: dict[str, bool] = dict(current) if isinstance(current, dict) else {}
    for key, value in patch.items():
        if key not in config.ALLOWED_HOME_CARD_IDS:
            continue
        if value is False:
            merged[key] = False
        elif value is True:
            merged.pop(key, None)
    return merged if merged else None


def _normalize_home_card_visibility(value: object) -> dict[str, bool] | None:
    if not isinstance(value, dict):
        return None
    normalized: dict[str, bool] = {}
    for key, visible in value.items():
        if not isinstance(key, str) or key not in config.ALLOWED_HOME_CARD_IDS:
            continue
        if visible is False:
            normalized[key] = False
    return normalized if normalized else None


def _merge_transitions(
    existing: dict[str, Any],
    patch: dict[str, Any] | None,
) -> dict[str, Any] | None:
    if patch is None:
        return None
    current = existing.get("transitions")
    merged = dict(current) if isinstance(current, dict) else {}
    for key, value in patch.items():
        if value is None:
            continue
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            next_nested = dict(merged[key])
            next_nested.update({k: v for k, v in value.items() if v is not None})
            merged[key] = next_nested
        else:
            merged[key] = value
    return merged


def _merge_email_settings(
    existing: dict[str, Any],
    patch: dict[str, Any] | None,
) -> dict[str, Any] | None:
    if patch is None:
        return None
    current = existing.get("email")
    merged = dict(current) if isinstance(current, dict) else {}
    patch_filters = patch.get("lastFetchFilters")
    if isinstance(patch_filters, dict):
        current_filters = merged.get("lastFetchFilters")
        next_filters = dict(current_filters) if isinstance(current_filters, dict) else {}
        for account_id, filters in patch_filters.items():
            if isinstance(filters, dict):
                next_filters[str(account_id)] = {
                    **(next_filters.get(str(account_id), {}) if isinstance(next_filters.get(str(account_id)), dict) else {}),
                    **{k: v for k, v in filters.items() if v is not None},
                }
        merged["lastFetchFilters"] = next_filters
    for key, value in patch.items():
        if key == "lastFetchFilters":
            continue
        if value is None:
            merged.pop(key, None)
        else:
            merged[key] = value
    return merged


def _merge_patch(existing: dict[str, Any], patch: UserSettingsPatch) -> dict[str, Any]:
    merged = dict(existing)
    payload = patch.model_dump(exclude_unset=True, by_alias=True)
    for key in patch.model_fields_set:
        value = payload.get(key)
        if key == "home_greeting_font_key":
            normalized = _normalize_greeting_font_key(
                value if isinstance(value, str) else None,
            )
            if normalized is None:
                merged.pop("home_greeting_font_key", None)
            else:
                merged["home_greeting_font_key"] = normalized
            continue
        if key == "home_greeting_font_size_px":
            normalized = _normalize_home_greeting_font_size_px(
                value if isinstance(value, int) else None,
            )
            if normalized is None:
                merged.pop("home_greeting_font_size_px", None)
            else:
                merged["home_greeting_font_size_px"] = normalized
            continue
        if key == "home_quote_interval_seconds":
            normalized = _normalize_home_quote_interval_seconds(
                value if isinstance(value, int) else None,
            )
            if normalized is None:
                merged.pop("home_quote_interval_seconds", None)
            else:
                merged["home_quote_interval_seconds"] = normalized
            continue
        if key == "nav_breadcrumb_max_entries":
            normalized = _normalize_nav_breadcrumb_max_entries(
                value if isinstance(value, int) else None,
            )
            if normalized is None:
                merged.pop("nav_breadcrumb_max_entries", None)
            else:
                merged["nav_breadcrumb_max_entries"] = normalized
            continue
        if key == "timezone":
            if value is None:
                merged.pop("timezone", None)
            else:
                normalized = _normalize_timezone(value if isinstance(value, str) else None)
                if normalized is None:
                    merged.pop("timezone", None)
                else:
                    merged["timezone"] = normalized
            continue
        if value is None:
            continue
        if key == "nav_panel" and isinstance(value, dict):
            current_panel = merged.get("nav_panel")
            if isinstance(current_panel, dict):
                next_panel = dict(current_panel)
                next_panel.update({k: v for k, v in value.items() if v is not None})
                merged["nav_panel"] = next_panel
            else:
                merged["nav_panel"] = {k: v for k, v in value.items() if v is not None}
            continue
        if key == "transitions" and isinstance(value, dict):
            next_transitions = _merge_transitions(merged, value)
            if next_transitions:
                merged["transitions"] = next_transitions
            else:
                merged.pop("transitions", None)
            continue
        if key == "shell_background" and isinstance(value, dict):
            next_shell_background = _merge_shell_background(merged, value)
            if next_shell_background:
                merged["shell_background"] = next_shell_background
            else:
                merged.pop("shell_background", None)
            continue
        if key == "home_slideshow" and isinstance(value, dict):
            next_home_slideshow = _merge_home_slideshow(merged, value)
            if next_home_slideshow:
                merged["home_slideshow"] = next_home_slideshow
            else:
                merged.pop("home_slideshow", None)
            continue
        if key == "nav_menu_visibility" and isinstance(value, dict):
            next_nav_visibility = _merge_nav_menu_visibility(merged, value)
            if next_nav_visibility:
                merged["nav_menu_visibility"] = next_nav_visibility
            else:
                merged.pop("nav_menu_visibility", None)
            continue
        if key == "home_card_visibility" and isinstance(value, dict):
            next_visibility = _merge_home_card_visibility(merged, value)
            if next_visibility:
                merged["home_card_visibility"] = next_visibility
            else:
                merged.pop("home_card_visibility", None)
            continue
        if key == "email" and isinstance(value, dict):
            next_email = _merge_email_settings(merged, value)
            if next_email:
                merged["email"] = next_email
            else:
                merged.pop("email", None)
            continue
        merged[key] = value
    merged.pop("dev_seed", None)
    merged.pop("transitions_enabled", None)
    return merged


# ----- Settings
async def seed_new_user_defaults(
    user_id: int,
    *,
    conn: asyncpg.Connection | None = None,
) -> None:
    """Create default preferences for a newly registered user when none exist."""
    if conn is not None:
        await _seed_new_user_defaults_on_conn(conn, user_id)
        return

    pool = get_pool()
    async with pool.acquire() as acquired:
        await _seed_new_user_defaults_on_conn(acquired, user_id)


async def _seed_new_user_defaults_on_conn(
    conn: asyncpg.Connection,
    user_id: int,
) -> None:
    existing = await repository.get_user_preferences(conn, user_id)
    if existing is not None:
        return
    await repository.upsert_user_preferences(
        conn,
        user_id=user_id,
        data={
            "home_card_visibility": config.default_home_card_visibility_all_hidden(),
        },
    )


async def get_settings(user_id: int) -> UserSettingsPublic:
    """Return stored settings for the user (empty document when unset)."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.get_user_preferences(conn, user_id)
    return _row_to_public(row)


async def patch_settings(
    user_id: int,
    payload: UserSettingsPatch,
) -> UserSettingsPublic:
    """Shallow-merge a partial update into the user's settings document."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await repository.get_user_preferences(conn, user_id)
        existing = _decode_jsonb_data(row["data"]) if row is not None else {}
        merged = _merge_patch(existing, payload)
        if "shell_background" in payload.model_fields_set:
            normalized = await _normalize_shell_background(
                user_id,
                merged.get("shell_background"),
            )
            if normalized is None:
                merged.pop("shell_background", None)
            else:
                merged["shell_background"] = normalized
        if "home_slideshow" in payload.model_fields_set:
            normalized = await _normalize_home_slideshow(
                user_id,
                merged.get("home_slideshow"),
            )
            if normalized is None:
                merged.pop("home_slideshow", None)
            else:
                merged["home_slideshow"] = normalized
        if "home_card_layout" in payload.model_fields_set:
            normalized = _normalize_home_card_layout(merged.get("home_card_layout"))
            if normalized is None:
                merged.pop("home_card_layout", None)
            else:
                merged["home_card_layout"] = normalized
        if "nav_menu_visibility" in payload.model_fields_set:
            normalized = _normalize_nav_menu_visibility(
                merged.get("nav_menu_visibility"),
            )
            if normalized is None:
                merged.pop("nav_menu_visibility", None)
            else:
                merged["nav_menu_visibility"] = normalized
        if "home_card_visibility" in payload.model_fields_set:
            normalized = _normalize_home_card_visibility(
                merged.get("home_card_visibility"),
            )
            if normalized is None:
                merged.pop("home_card_visibility", None)
            else:
                merged["home_card_visibility"] = normalized
        row = await repository.upsert_user_preferences(
            conn,
            user_id=user_id,
            data=merged,
        )
    return _row_to_public(row)
