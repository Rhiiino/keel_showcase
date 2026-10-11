# 2026_07_05_timeline_event_all_day

Adds `all_day` to `timeline_events` so calendar and forms use an explicit flag instead of inferring from UTC midnight timestamps.

## Apply (local dev)

From `keel_api/` with the dev stack running:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db \
  psql -U keel -d keel -f - \
  < scripts/db/migrations/2026_07_05_timeline_event_all_day/schema.sql
```

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" \
  -f scripts/db/migrations/2026_07_05_timeline_event_all_day/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.

## Verify

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db \
  psql -U keel -d keel -c "\d timeline_events"
```

Confirm `all_day` column exists. Promoted all-day events should have `all_day = true` after backfill.
