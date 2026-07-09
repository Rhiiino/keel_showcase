# keel_api/src/modules/media/README.md

# Media module

Unified Garage-backed media storage, nested folders, and entity attachments.

## Tables

| Table | Purpose |
|-------|---------|
| `media_folders` | User-owned nested folders (`parent_folder_id`, soft-delete via `deleted_at`) |
| `media_objects` | One row per uploaded file (UUID id, optional `folder_id`, storage key, MIME, size, kind, status) |
| `media_attachments` | Links media to `project`, `finance_transaction`, `finance_obligation`, `contact`, `finance_vendor`, `timeline_event`, or `journal_entry` with role |
| `media_panels` | User-owned curated display boards (name, column count, row unit height) |
| `media_panel_items` | Grid-placed tiles on a panel (`grid_x`, `grid_y`, `col_span`, `row_span`, `preview_scale`, `preview_focal_x`, `preview_focal_y`, `border_color`, FK to `media_objects`) |

## HTTP routes

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/media` | Folder contents for current user (`?folder_id=` optional); folder rows include cumulative subtree `byte_size` |
| `GET` | `/media/all` | Flat list of all user media (any folder) |
| `POST` | `/media` | Upload file (optional `folder_id` form field) |
| `GET` | `/media/{media_id}` | Stream download (Range supported) |
| `GET` | `/media/{media_id}/metadata` | Metadata only |
| `PATCH` | `/media/{media_id}` | Rename and/or move (`folder_id`) |
| `PUT` | `/media/{media_id}/content` | Replace stored bytes (keeps id and attachments) |
| `DELETE` | `/media/{media_id}` | Delete when unattached |
| `POST` | `/media/folders` | Create folder |
| `PATCH` | `/media/folders/{folder_id}` | Rename or move folder |
| `DELETE` | `/media/folders/{folder_id}` | Delete empty folder |
| `POST` | `/media/{media_id}/attachments` | Attach to entity |
| `GET` | `/media/{media_id}/attachments` | List attachments for one media object |
| `DELETE` | `/media/attachments/{attachment_id}` | Detach |
| `PATCH` | `/media/attachments/{attachment_id}` | Update attachment metadata |
| `GET` | `/media/by-entity/{entity_type}/{entity_id}` | List attachments |
| `GET` | `/media/panels` | List display panels |
| `POST` | `/media/panels` | Create panel |
| `GET` | `/media/panels/{panel_id}` | Panel detail with nested media tiles |
| `PATCH` | `/media/panels/{panel_id}` | Rename panel |
| `DELETE` | `/media/panels/{panel_id}` | Soft-delete panel |
| `POST` | `/media/panels/{panel_id}/items` | Add media tile (optional placement + `layout_updates` for split-add) |
| `PATCH` | `/media/panels/{panel_id}/items/{item_id}` | Update one tile placement, preview framing, or border color |
| `POST` | `/media/panels/{panel_id}/items/swap` | Swap grid placements between two tiles |
| `PUT` | `/media/panels/{panel_id}/layout` | Batch replace tile placements after reflow |
| `DELETE` | `/media/panels/{panel_id}/items/{item_id}` | Remove tile (compact neighbors) |

## Files

| File | Role |
|------|------|
| `router.py` | HTTP routes |
| `service.py` | Upload, download, folders, attachments |
| `panel_service.py` | Display panel CRUD, layout validation, reflow |
| `panel_grid.py` | Packed-grid and elastic resize helpers |
| `repository.py` | SQL for media_folders / media_objects / media_attachments / panels |
| `access.py` | Entity ownership checks |
| `validation.py` | MIME/size validation |
| `schemas.py` | `MediaPublic`, `MediaFolderPublic`, `MediaFolderContentsPublic` |

## Storage

Object bytes live in Garage (S3). Keys: `users/{user_id}/{uuid}{ext}` via `core/storage/`. Folder paths are metadata only — moving files does not change storage keys.

## Module changelog

- **2026-06-30** — Add `journal_entry` to `media_attachments.entity_type` for journal entry gallery files.
- **2026-06-25** — Add `timeline_event` to `media_attachments.entity_type` for timeline event gallery files.
- **2026-06-20** — Add media display panels (`media_panels`, `media_panel_items`) with packed-grid layout validation and `/media/panels` HTTP API.
- **2026-06-20** — `media_panel_items.border_color` and `POST /media/panels/{panel_id}/items/swap` (migration `2026_06_20_general_updates`).
- **2026-06-20** — `POST /media/panels/{panel_id}/items` accepts optional `layout_updates` for atomic split-add tile placement.
- **2026-06-20** — `media_panel_items` preview columns (`preview_scale`, `preview_focal_x`, `preview_focal_y`) for persisted tile zoom/framing.
- **2026-06-20** — Add cumulative folder subtree byte sizes to scoped `GET /media` folder rows.
- **2026-06-20** — Add `media_folders`, `media_objects.folder_id`, folder CRUD, and scoped `GET /media` contents response.
