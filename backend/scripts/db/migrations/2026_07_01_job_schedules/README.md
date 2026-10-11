# 2026_07_01_job_schedules

Adds `job_schedules` for calendar-based recurring Celery tasks and links optional `schedule_id` on `job_runs`.

## Apply (production)

```bash
docker compose exec api sh -c 'psql "$DATABASE_URL" -f scripts/db/migrations/2026_07_01_job_schedules/schema.sql'
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.

## Verify

```bash
docker compose exec db psql -U keel -d keel -c "\d job_schedules"
docker compose exec db psql -U keel -d keel -c "SELECT name, recurrence, hour, minute FROM job_schedules;"
```
