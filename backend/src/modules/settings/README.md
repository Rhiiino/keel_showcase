# Settings

Per-user UI preferences stored as JSON in Postgres.

## Purpose

Settings owns the `user_preferences` row for each signed-in user. The frontend reads and patches theme, nav layout, page transitions, home quote interval, home slideshow, home card layout, home card visibility, greeting font, and module-specific JSON blobs (e.g. focus constellation prefs written by the focus module via this repository).

## Module type

**Infrastructure** — cross-cutting UI state; consumed by frontend and indirectly by focus for nested preference keys.

## HTTP API

**Prefix:** `/settings`  
**Auth:** Session required on all routes (`get_current_user`).  
**Registered in:** `keel_api/src/main.py` → second router (`settings_router`).

| Area | Endpoints |
|------|-----------|
| Preferences | `GET /settings`, `PATCH /settings` |

**Notable config:** `DEFAULT_GREETING_FONT_KEY`; `DEFAULT_HOME_GREETING_FONT_SIZE_PX` (36), min/max 20–72; home quote interval min/default/max (2 / 3 / 60 seconds); home slideshow interval min/default/max (2 / 8 / 60 seconds), max 50 images; `ALLOWED_GREETING_FONT_KEYS`.

## Frontend integration

**Frontend counterpart:** [keel_web/src/modules/settings/README.md](../../../../keel_web/src/modules/settings/README.md)

Theme, transitions, nav order, and greeting preferences sync through `GET/PATCH /settings`.

## Database

| Table | Purpose |
|-------|---------|
| `user_preferences` | One row per user; `settings` JSON column for all UI prefs |

Other modules may write nested keys under this JSON via `settings.repository` (e.g. focus constellation state) without exposing separate HTTP routes.

## Directory structure

```
settings/
├── __init__.py
├── config.py       # Greeting font keys, quote interval bounds
├── router.py       # GET/PATCH /settings
├── service.py      # Merge partial updates into stored JSON
├── repository.py   # user_preferences upsert/read SQL
└── schemas.py      # SettingsPublic, SettingsUpdate
```

## Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| `router.py` | Thin GET/PATCH handlers |
| `service.py` | Deep-merge incoming patch with existing JSON |
| `repository.py` | Read/upsert `user_preferences` for current user |
| `schemas.py` | Typed view of known preference fields |
| `config.py` | Validation constants for greeting font and quote timing |

## Dependencies

- **core/** — pool, errors, `USER_PREFERENCES` table constant
- **Written by** — `modules.focus.service` (constellation/reference preference keys)

## Maintenance guidelines

- When adding a new top-level preference key, update `schemas.py` and the frontend settings module README.
- Nested module keys should use documented constant prefixes in the owning module's config (e.g. focus `PREFERENCES_FOCUS_KEY`).
- Keep merge logic tolerant of unknown keys so older clients do not break.

## Related documentation

- [Modules umbrella README](../README.md)
- [PROJECT_TREE.md](../../../PROJECT_TREE.md)
- Frontend: [keel_web/src/modules/settings/README.md](../../../../keel_web/src/modules/settings/README.md)

## Module changelog

- **2026-07-09** — `nav_menu_visibility` preference: per-item `{ [id]: false }` flags to hide nav menu items without changing `nav_menu_layout` order.
- **2026-07-04** — `home_card_visibility` preference: per-card `{ [id]: false }` flags to hide home dashboard cards without clearing layout or card-specific settings.
- **2026-07-03** — `home_card_layout` preference: validated `{ id, x, y }` entries for draggable home cards; optional `width`/`height` for resizable cards (`slideshow`, `alive-timer`).
- **2026-07-03** — `home_slideshow` preference: ordered image `media_ids`, optional `interval_seconds`, optional `paused`, and optional `paused_media_id` (stored while paused, cleared on resume) with validation on PATCH.
- **2026-06-15** — Initial module manifest.
