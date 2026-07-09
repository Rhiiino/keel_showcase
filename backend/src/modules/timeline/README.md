# Timeline

User-owned life events with optional contact and figure tagging, colored label tags, and flexible date ranges.

## Purpose

Timeline tracks life events for the signed-in user — single-day or ranged dates, free-text subject names for people not in contacts or figures, many-to-many links to contact and figure records, and user-defined colored tags for grouping and filtering.

## Module type

**Feature** — routes, nav, and API.

## HTTP API

**Prefix:** `/timeline`  
**Auth:** Session required on all routes.  
**Registered in:** `keel_api/src/main.py` → `timeline_router` (after shop).

| Area | Endpoints |
|------|-----------|
| Tags | `GET/POST /timeline/tags`, `PATCH/DELETE /timeline/tags/{id}` |
| Events | `GET/POST /timeline/events`, `GET/PATCH/DELETE /timeline/events/{id}` |
| Plans | `GET/POST /timeline/plans`, `GET/PATCH/DELETE /timeline/plans/{id}`, `GET/POST /timeline/plans/{id}/items` |
| Plan items | `GET/PATCH/DELETE /timeline/plan-items/{id}`, `POST /timeline/plan-items/{id}/reorder`, `POST /timeline/plan-items/{id}/promote`, `POST /timeline/plan-items/{id}/link-event` |
| Calendar feed | `GET /timeline/calendar?start=&end=` — events + plan items in range |

**Query params (list):** `contact_id`, repeatable `contact_ids` (OR), `figure_id`, repeatable `figure_ids` (OR), `subject_name` (partial match on free-text subject only), `query` (description, subject name, contact/figure names), `start_date_from`, `start_date_to` (optional overlap filter for calendar views), `tag_ids` (repeatable; OR filter — events matching any selected tag).

**Write payloads:** `tag_ids` on event create/update replaces all tag assignments (same semantics as projects). `reminders` replaces all notification offsets (amount + unit: minutes, hours, or days; max 5 per event).

**Event list/detail response:** includes `reminders[]` with `id`, `amount`, `unit`, optional `sent_at` (set when the polling job processes the reminder).

**Tag list response:** each tag includes `event_count` — distinct timeline events assigned to that tag for the current user.

## Frontend integration

**Frontend counterpart:** [keel_web/src/modules/timeline/README.md](../../../../keel_web/src/modules/timeline/README.md)

## Database

| Table | Purpose |
|-------|---------|
| `timeline_events` | User-owned event rows (description, start/end timestamps, optional subject_name) |
| `timeline_event_contacts` | Junction — many contacts per event |
| `timeline_event_figures` | Junction — many figures per event |
| `timeline_tags` | User-owned colored label catalog (name, optional description, color) |
| `timeline_tag_assignments` | Junction — tags on events or plan items (one entity per row) |
| `timeline_plans` | Bounded-period plans (title, date range, notes) |
| `timeline_plan_items` | Dated/timed lines within a plan (optional link to promoted `timeline_event`) |
| `timeline_event_reminders` | Per-event notification offsets before `start_date` |

**Media:** files attach via `media_attachments` with `entity_type = 'timeline_event'` and `role = 'gallery'` (see media module).

**Reminders:** processed by `jobs.tasks.timeline.check_reminders` (configure an interval schedule in the Jobs UI).

## Directory structure

```
timeline/
├── __init__.py
├── config.py       # EVENTS_PATH, PLANS_PATH, TAG_LIST_PATH, DEFAULT_TAG_COLOR_HEX
├── router.py       # Tag, event, plan, plan-item, calendar routes
├── service.py      # Event ownership, contact/tag validation, junction sync
├── plans_service.py  # Plan/plan-item CRUD, promote, link-event
├── repository/
│   ├── __init__.py # Re-exports events, tags, plans SQL
│   ├── events.py   # timeline_events + timeline_event_contacts/figures SQL
│   ├── plans.py    # timeline_plans + timeline_plan_items SQL
│   ├── reminders.py  # timeline_event_reminders SQL + due-reminder queries
│   └── tags.py     # timeline_tags + timeline_tag_assignments SQL
└── schemas.py      # TimelineTagPublic, TimelineEventPublic, plan DTOs, Create, Update
```

## Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| `router.py` | Tag CRUD + event/plan/plan-item/calendar handlers |
| `service.py` | Event user ownership, contact/tag validation, date validation |
| `plans_service.py` | Plan date validation, plan-item CRUD, promote/link-event |
| `repository/` | SQL + contact/tag hydration for list/detail |
| `schemas.py` | Public and write DTOs |
| `config.py` | Route path constants |

## Dependencies

- **core/** — pool, table constants
- **contacts** — existence check only (`contacts` table has no `user_id`)

## Related documentation

- [Modules umbrella README](../README.md)
- [PROJECT_TREE.md](../../../PROJECT_TREE.md)
- Frontend: [keel_web/src/modules/timeline/README.md](../../../../keel_web/src/modules/timeline/README.md)

## Module changelog

- **2026-07-05** — Timeline planner: `timeline_plans`, `timeline_plan_items`, shared `timeline_tag_assignments` (events + plan items), plan CRUD, promote-to-event, calendar feed.
- **2026-07-01** — Event notification reminders (`timeline_event_reminders`, `reminders` on event API, validation, dry-run jobs task integration).
- **2026-06-24** — Initial timeline events module with junction contact tagging.
- **2026-06-25** — `timeline_event` media attachment entity type (gallery files on events).
- **2026-06-27** — Optional `start_date_from` / `start_date_to` list filters for calendar range loading (overlap query, no schema change).
- **2026-06-27** — User-defined event label tags (`timeline_tags`, assignments, CRUD API, `tag_ids` on events, list filter).
- **2026-06-27** — Calendar list filters: repeatable `contact_ids` (OR) and `subject_name` partial match.
- **2026-06-27** — `start_date` / `end_date` columns changed from `DATE` to `TIMESTAMPTZ` (migration `2026_06_27_1500_timeline_event_timestamps`).
