# 2026_06_24_1200_timeline_events

Adds `timeline_events` and `timeline_event_contacts` for the Timeline module.

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" -f scripts/db/migrations/2026_06_24_1200_timeline_events/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.
