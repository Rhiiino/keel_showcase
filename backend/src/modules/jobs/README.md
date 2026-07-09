# Jobs

Background job infrastructure — Celery workers, Celery Beat schedules, Redis broker, Postgres tracking, and session HTTP API for runs and schedules.

## Purpose

The jobs module is cross-cutting **infrastructure** with a **session HTTP API** for the web UI. Feature modules enqueue work through `dispatch.enqueue()`; Celery workers execute tasks off the HTTP path; `job_schedules` stores recurrence rules (calendar wall-clock or every-N-minutes interval); enabled schedules sync to Celery Beat on startup; `job_runs` records execution history.

## Module type

**Infrastructure** — Celery worker/Beat processes import this package; HTTP routes serve the `keel_web` jobs module.

## Processes

| Process | Docker service | Role |
|---------|----------------|------|
| Redis | `redis` | Message broker + optional result backend |
| Celery worker | `worker` | Executes queued tasks (`default`, `heavy` queues) |
| Celery Beat | `beat` | Loads enabled `job_schedules` rows into Beat; reloads when schedules change via API |

## Directory structure

```
jobs/
├── __init__.py
├── TASKS.md
├── config.py              # Queues, task names, HTTP paths, allowlists
├── router.py              # HTTP routes (runs + schedules)
├── schemas.py             # Pydantic DTOs
├── celery_app.py          # Shim → worker.app (Docker entrypoint)
├── dispatch.py            # Shim → worker.dispatch.enqueue
├── runtime.py             # Shim → worker.runtime.run_async
├── repository/
│   ├── __init__.py        # Barrel re-export
│   ├── runs.py            # job_runs SQL
│   └── schedules.py       # job_schedules SQL
├── service/
│   ├── __init__.py        # Barrel re-export
│   ├── _helpers.py        # Record mappers, validation helpers
│   ├── runs.py            # Run list/get/delete
│   ├── schedules.py       # Schedule CRUD, run now, task options
│   ├── tasks.py           # Registered task catalog (read-only)
│   └── schedule_cron.py   # Recurrence → crontab + summary + next_run_at
├── worker/
│   ├── __init__.py
│   ├── app.py             # Celery instance, autodiscover, task routes
│   ├── dispatch.py        # enqueue() implementation
│   ├── runtime.py         # asyncio bridge + worker DB pool
│   ├── signals.py         # Celery lifecycle → job_runs sync
│   ├── beat_loader.py     # Beat startup + live reload of enabled job_schedules
│   └── registry.py        # Task name → Celery Task lookup
└── tasks/
    ├── __init__.py
    ├── backup_lib.py      # Postgres + Garage backup helpers
    ├── ping.py
    ├── maintenance.py
    ├── timeline.py        # Timeline reminder polling (dry run)
    └── backup.py
```

## HTTP API

Registered in [`main.py`](../../main.py). All routes require session auth.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/jobs/runs` | List job runs (`status`, `task_name`, `schedule_id`, `triggered_by`, `limit`, `offset`) |
| GET | `/jobs/runs/{run_id}` | Job run detail |
| DELETE | `/jobs/runs/{run_id}` | Delete a job run history row |
| GET | `/jobs/tasks` | List registered tasks with static metadata (description, queue, kwargs) |
| GET | `/jobs/schedules` | List schedules |
| POST | `/jobs/schedules` | Create schedule |
| GET | `/jobs/schedules/{schedule_id}` | Schedule detail |
| PATCH | `/jobs/schedules/{schedule_id}` | Update schedule |
| DELETE | `/jobs/schedules/{schedule_id}` | Delete schedule |
| POST | `/jobs/schedules/{schedule_id}/run` | Enqueue the schedule's task immediately |
| GET | `/jobs/schedules/task-options` | Allowlisted tasks for UI |

Schedule responses include `schedule_summary` (human-readable recurrence), `next_run_at` (computed from crontab when `enabled`; `null` when disabled), and `run_count` (linked `job_runs` rows).

## Database

| Table | Purpose |
|-------|---------|
| `job_runs` | Execution history (status, payload, result, error, optional `schedule_id`) |
| `job_schedules` | Recurring rules: daily / weekly / monthly / yearly at wall-clock time, or `interval` (every N minutes) |

Schema: [`scripts/db/init/001_schema.sql`](../../../scripts/db/init/001_schema.sql) (`job_runs`, `job_schedules`, timeline reminder columns).

## Registered tasks

| Task | Name | Trigger |
|------|------|---------|
| Ping | `jobs.tasks.ping.run` | Manual |
| Purge expired sessions | `jobs.tasks.maintenance.purge_expired_sessions` | Manual, Run now, or UI schedule |
| Create backup | `jobs.tasks.backup.create` | Manual or UI schedule |
| Check timeline reminders | `jobs.tasks.timeline.check_reminders` | Manual, Run now, or interval UI schedule (dry-run log + mark sent) |
| Check service health | `jobs.tasks.services.check_all` | Manual, Run now, or UI schedule |

## Schedulable tasks (HTTP allowlist)

Configured in `config.SCHEDULABLE_TASKS` — purge sessions, backup, timeline reminder check, and service health check.

## Adding and updating tasks

**→ [TASKS.md](./TASKS.md)** — step-by-step guide for registering Celery tasks, wiring queues, exposing tasks in the UI scheduler, and enqueueing from feature modules.

## Module changelog

- **2026-07-01** — `GET /jobs/tasks` — read-only catalog of registered tasks with description, queue, schedulable flag, and kwargs metadata.
- **2026-07-01** — Schedule API responses include `run_count` (linked `job_runs` rows).
- **2026-07-01** — Celery Beat reloads enabled `job_schedules` live when schedules are created, updated, or deleted (no Beat restart required).
- **2026-07-01** — Removed code-defined Celery Beat schedule (`purge-expired-sessions-daily`); recurring jobs use `job_schedules` with Beat sync on startup.
- **2026-07-01** — Reorganized module into `repository/`, `service/`, and `worker/` subpackages; root shims preserve `celery_app`, `dispatch`, and `runtime` import paths.
- **2026-07-01** — [TASKS.md](./TASKS.md) — developer guide for adding and updating background tasks.

- **2026-07-01** — Schedule API responses include computed `next_run_at` via `schedule_cron.compute_next_run_at`.
- **2026-07-01** — Weekly schedules store `days_of_week` (Postgres array) for multi-day recurrence; summaries and crontab mapping updated.
- **2026-07-01** — HTTP API for job runs list and job schedules CRUD; `job_schedules` table with calendar recurrence fields.
- **2026-06-30** — Backup task; initial Celery + Beat + `job_runs` infrastructure.
