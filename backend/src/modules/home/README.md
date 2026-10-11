# Home

Inspirational quotes for the authenticated landing page rotator.

## Purpose

Home exposes read-only access to seeded inspirational quotes. The frontend home page cycles through quotes at an interval configured in user settings. This is a minimal utility module with no user-owned mutable data.

## Module type

**Utility** — small read-only surface; no LLM tools or media.

## HTTP API

**Prefix:** `/home`  
**Auth:** Session required on all routes.  
**Registered in:** `keel_api/src/main.py` → `home_router` (before shop).

| Area | Endpoints |
|------|-----------|
| Quotes | `GET /home/quotes` |

## Frontend integration

**Frontend counterpart:** [keel_web/src/modules/home/README.md](../../../../keel_web/src/modules/home/README.md)

Home page fetches the quote list once and rotates display using interval from `/settings`.

## Database

| Table | Purpose |
|-------|---------|
| `quotes` | Global seed data — inspirational quote text and attribution |

Not per-user; loaded from init/seed SQL on fresh database volumes.

## Directory structure

```
home/
├── __init__.py
├── config.py       # QUOTES_PATH = "/quotes"
├── router.py       # GET /home/quotes
├── service.py      # Passthrough to repository
├── repository.py   # quotes SELECT
└── schemas.py      # QuotePublic
```

## Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| `router.py` | Single list endpoint |
| `service.py` | Thin delegate |
| `repository.py` | Load all quotes ordered for rotator |
| `schemas.py` | Public quote shape |
| `config.py` | Route path constant |

## Dependencies

- **core/** — pool, `QUOTES` table constant
- **Related** — `modules.settings` (quote rotation interval lives in user prefs, not this module)

## Maintenance guidelines

- Quote content changes belong in seed SQL / migrations, not code.
- If quotes become user-editable, expand schemas and add write routes before updating this README.

## Related documentation

- [Modules umbrella README](../README.md)
- [PROJECT_TREE.md](../../../PROJECT_TREE.md)
- Frontend: [keel_web/src/modules/home/README.md](../../../../keel_web/src/modules/home/README.md)

## Module changelog

- **2026-06-15** — Initial module manifest.
