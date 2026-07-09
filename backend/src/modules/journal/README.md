# Journal

User-owned personal journal entries with day-level dates and colored label tags.

## Purpose

Journal lets the signed-in user write dated entries, assign colored tags, and browse or filter entries by tag, text, or date range.

## Module type

**Feature** — routes, nav, and API.

## HTTP API

**Prefix:** `/journal`  
**Auth:** Session required on all routes.  
**Registered in:** `keel_api/src/main.py` → `journal_router` (after timeline).

| Area | Endpoints |
|------|-----------|
| Tags | `GET/POST /journal/tags`, `PATCH/DELETE /journal/tags/{id}` |
| Entries | `GET/POST /journal/entries`, `GET/PATCH/DELETE /journal/entries/{id}` |

**Query params (list):** `query` (content ILIKE), `entry_date_from`, `entry_date_to`, repeatable `tag_ids` (OR — entries matching any selected tag).

**Write payloads:** `tag_ids` on entry create/update replaces all tag assignments.

**Tag list response:** each tag includes `entry_count` — distinct journal entries assigned to that tag for the current user.

## Frontend integration

**Frontend counterpart:** [keel_web/src/modules/journal/README.md](../../../../keel_web/src/modules/journal/README.md)

## Database

| Table | Purpose |
|-------|---------|
| `journal_entries` | User-owned rows (`entry_date` DATE, `content` TEXT) |
| `journal_tags` | User-owned colored label catalog |
| `journal_entry_tag_assignments` | Junction — many tags per entry |

**Schema:** `scripts/db/init/001_schema.sql` (journal tables and indexes).

**Media:** gallery files attach via `media_attachments` with `entity_type = 'journal_entry'` and `role = 'gallery'` (see media module; migration `2026_06_30_journal_entry_media`).

## Directory structure

```
journal/
├── config.py       # ENTRIES_PATH, TAG_LIST_PATH, DEFAULT_TAG_COLOR_HEX
├── router.py       # Tag + entry CRUD routes
├── service.py      # Ownership, tag validation, junction sync
├── repository/
│   ├── __init__.py # Re-exports entries + tags SQL
│   ├── entries.py  # journal_entries SQL + list filters
│   └── tags.py     # journal_tags + journal_entry_tag_assignments SQL
└── schemas.py      # JournalTagPublic, JournalEntryPublic, Create, Update
```

## Dependencies

- **core.database** — asyncpg pool
- **core.tables** — `JOURNAL_ENTRIES`, `JOURNAL_TAGS`, `JOURNAL_ENTRY_TAG_ASSIGNMENTS`
- **modules.media** — `journal_entry` entity type for gallery attachments (no journal-specific media routes)

## Module changelog

- **2026-06-30** — Gallery file attachments on entries via media module (`journal_entry` entity type).
- **2026-06-27** — Initial journal module with entries, tags, and list filters.
