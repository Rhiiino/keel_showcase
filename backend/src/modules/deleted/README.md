# Deleted module (Recently Deleted)

Global trash snapshots, restore/purge API, and entity-specific handlers.

## HTTP API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/deleted/config` | Retention days + purge schedule hint |
| GET | `/deleted` | List active trash rows (`?entity_type=` optional) |
| GET | `/deleted/{id}` | Trash row detail (includes payload) |
| POST | `/deleted/{id}/restore` | Restore captured entity |
| DELETE | `/deleted/{id}` | Permanently purge now |

## Environment

| Variable | Purpose | Default |
|----------|---------|---------|
| `RECENTLY_DELETED_RETENTION_DAYS` | Days before expired rows are purged | `30` |

## Database

- `deleted_records` — snapshot rows with JSONB `payload`, `expires_at`, optional `purge_group_id`

Schema: `scripts/db/init/001_schema.sql` (`deleted_records` table).

## Background jobs

- `jobs.tasks.maintenance.purge_expired_deleted_records` — daily schedule seeded in migration

## Module changelog

- **2026-07-03** — Initial `deleted_records` table, handler registry, and `/deleted` API.
