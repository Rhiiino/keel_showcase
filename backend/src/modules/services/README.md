# Services module

HTTP health monitors for external application URLs. Each service row stores probe config and last check results; a Celery task probes all `check_enabled` rows on a schedule.

## Registered in

[`main.py`](../../main.py) — `services_router` at `/services`.

## HTTP API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/services` | List current user's services |
| POST | `/services` | Create a service |
| GET | `/services/{id}` | Get one service |
| PATCH | `/services/{id}` | Update config fields |
| DELETE | `/services/{id}` | Delete a service |
| POST | `/services/{id}/check` | Run an immediate health probe |

## Database

Table `services` — migrations [`2026_07_03_services`](../../../scripts/db/migrations/2026_07_03_services/), [`2026_07_04_services_type_description`](../../../scripts/db/migrations/2026_07_04_services_type_description/), [`2026_07_04_services_name_type_unique`](../../../scripts/db/migrations/2026_07_04_services_name_type_unique/).

Config fields include `service_type` (`frontend` | `backend`) and optional `description`. Uniqueness is per user + name + type.

Status values: `up`, `caution`, `down` (or `NULL` before first check).

## Background jobs

| Task | Name |
|------|------|
| Check service health | `jobs.tasks.services.check_all` |

Probe logic lives in [`check.py`](./check.py) and is shared with `POST /services/{id}/check`.

## Directory structure

```
services/
├── check.py       # HTTP probe + status transition
├── config.py
├── helpers.py
├── repository.py
├── router.py
├── schemas.py
├── service.py
└── README.md
```

## Module changelog

- **2026-07-04** — Uniqueness on `(user_id, service_name, service_type)`; `service_type` and optional `description`.
- **2026-07-03** — Initial services module: CRUD, per-row failure threshold, batch Celery probe, manual check endpoint.
