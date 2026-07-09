# Figures

Public people records — celebrities, creators, politicians, and other figures tracked separately from personal contacts.

## Purpose

Figures stores user-owned records for public or notable people with the same core person fields as contacts (name, gender, birth/death dates, notes) but without CRM concepts (relationships, tags, family groups, or self-contact). Profile photos use unified Garage media. Figures can be linked from Focus references and tagged on timeline events.

## Module type

**Feature** — session auth, user-owned rows, frontend counterpart.

## HTTP API

**Prefix:** `/figures`  
**Auth:** Session required on all routes.  
**Registered in:** `keel_api/src/app_modules/registry.py`.

| Area | Endpoints |
|------|-----------|
| Figures | `GET/POST /figures`, `GET/PATCH/DELETE /figures/{figure_id}` |

Profile photos use the unified **`/media`** API ([`modules/media/README.md`](../media/README.md)).

## Media integration

| Role | Attachment | Notes |
|------|------------|-------|
| Profile photo | `media_attachments` with `entity_type = 'figure'`, `role = 'photo'` | One per figure; hydrated as `FigurePublic.photo` |

Upload via `POST /media`; attach via `POST /media/{media_id}/attachments`. List: `GET /media/by-entity/figure/{figure_id}`.

## Deleted / trash

Soft delete via `deleted_service.trash_entity` with handler `entity_type = 'figure'` ([`modules/deleted/handlers/figures.py`](../deleted/handlers/figures.py)).

## Focus integration

Registered in `focus/reference_registry` as `target_type: "figure"` with `web_path: /people/figures/{id}`.

## Timeline integration

Events accept `figure_ids` on create/update. Junction table `timeline_event_figures` links events to figures (parallel to `timeline_event_contacts`).

## Frontend integration

**Frontend counterpart:** [keel_web/src/modules/people/figures/](../../../keel_web/src/modules/people/figures/) (People module → Figures sub-tab).

## Database

| Table | Purpose |
|-------|---------|
| `figures` | Person records (name, dates, gender, notes, status); scoped by `user_id` |
| `timeline_event_figures` | Many-to-many link between timeline events and figures |

## Directory structure

```
figures/
├── __init__.py
├── config.py       # Gender/status validation sets
├── router.py       # CRUD routes
├── service.py      # Validation, photo hydration, trash delete
├── repository.py   # figures SQL
└── schemas.py      # Figure DTOs
```

## Module changelog

- **2026-07-07** — Initial figures module: CRUD, media photo attachments, Focus reference type, timeline figure tagging, trash handler.
