# 2026_06_30_1800_job_runs

Adds `job_runs` for Celery background task status and history.

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" -f scripts/db/migrations/2026_06_30_1800_job_runs/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.

## Verify

```bash
docker compose exec db psql -U keel -d keel -c "\d job_runs"
```
