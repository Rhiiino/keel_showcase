# Coak

Learning workspace module — **C**ulmination **o**f **a**ll **K**nowledge. Users create Coak records (topics), organize folders/notes/flash cards in a directory tree (any item may attach a file), and explore relationships in a 3D constellation graph.

## Module type

**Feature** — session-required UI with full backend integration.

## Registered in

[`main.py`](../../main.py)

## HTTP API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/coak/records` | List user's records |
| POST | `/coak/records` | Create record |
| GET | `/coak/records/{id}` | Get one record |
| PATCH | `/coak/records/{id}` | Update record name / origin color |
| DELETE | `/coak/records/{id}` | Delete record (cascades items) |
| GET | `/coak/records/{id}/items` | List directory items |
| POST | `/coak/records/{id}/items` | Create folder, note, or flash item (optional `media_id`) |
| PATCH | `/coak/records/{id}/items/{item_id}` | Rename, recolor, move, edit content, attach/detach `media_id`, promote note to folder |
| DELETE | `/coak/records/{id}/items/{item_id}` | Delete item (cascades children) |
| GET/POST | `/coak/records/{id}/tags` | List / create record-scoped tags |
| PATCH/DELETE | `/coak/records/{id}/tags/{tag_id}` | Update / trash tag |
| GET/PATCH | `/coak/records/{id}/workspace-state` | Node positions, expanded folders, pinned item ids, camera |
| GET/PATCH | `/coak/records/{id}/workspace-settings` | Panel layout and z-order |
| GET/PATCH | `/coak/records/{id}/configuration-settings` | Per-record workspace configuration (visual/options) |

## Database

| Table | Purpose |
|-------|---------|
| `coak_records` | Learning topic; `color_hex` colors the origin node; `workspace_state`, `workspace_settings`, and `configuration_settings` JSONB columns store per-record workspace layout |
| `coak_items` | Directory entries (`kind`: `folder`, `note`, `flash`) with hierarchy via `parent_id`; optional `media_id` file attachment on any kind; flash items store `flash_front` / `flash_back` |
| `coak_tags` | Record-scoped colored tag catalog (unique name per record) |
| `coak_item_tag_assignments` | Many-to-many links between coak items and tags within a record |

Migrations: `scripts/db/migrations/2026_07_01_coak/schema.sql`, `scripts/db/migrations/2026_07_01_coak_flash_items/schema.sql`, `scripts/db/migrations/2026_07_02_coak_record_workspace/schema.sql`, `scripts/db/migrations/2026_07_03_coak_item_media_attachment/schema.sql`, `scripts/db/migrations/2026_07_04_coak_tags/schema.sql`, `scripts/db/migrations/2026_07_05_coak_tag_description/schema.sql`

## Storage and environment

Items may reference `media_objects` (Garage/S3) via optional `media_id`. Upload via `POST /media`, then `PATCH` the item with `media_id`. Replace file bytes via `PUT /media/{id}/content`; detach with `PATCH` `media_id: null`.

## Dependencies

- `media` — file upload, replace, and delete for item attachments

## Directory structure

```
coak/
├── config.py
├── router.py
├── schemas.py
├── repository/
│   ├── records.py
│   ├── items.py
│   └── tags.py
└── service/
    ├── helpers.py
    ├── records.py
    ├── items.py
    ├── tags.py
    └── workspace_state.py
```

## Adding a new item kind

1. Migration: extend `coak_items_kind_valid` CHECK and add any new columns.
2. `config.py`: add kind to `COAK_ITEM_KINDS`.
3. `schemas.py`: extend `CoakItemKind` literal.
4. `service/items.py`: add kind defaults in `_KIND_CREATE_DEFAULTS`; media attach/detach stays kind-agnostic.

## Module changelog

- **2026-07-05** — Coak tag catalog API returns optional `description`; PATCH accepts description updates.
- **2026-07-03** — Removed `file` item kind; optional `media_id` on folder/note/flash; migration converts existing file rows to notes.
