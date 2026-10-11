# 2026_06_27_1500_timeline_event_timestamps

Changes `timeline_events.start_date` and `timeline_events.end_date` from `DATE` to `TIMESTAMPTZ`. Existing date-only rows become midnight UTC on that calendar date.

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" -f scripts/db/migrations/2026_06_27_1500_timeline_event_timestamps/schema.sql
```

**Local fallback** (when `api` cannot reach Postgres via `$DATABASE_URL`):

```bash
docker compose exec -T db psql -U keel -d keel -f - < scripts/db/migrations/2026_06_27_1500_timeline_event_timestamps/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.
