# 2026_06_25_1200_timeline_event_media

Adds `timeline_event` to `media_attachments.entity_type` for timeline event file gallery links.

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" -f scripts/db/migrations/2026_06_25_1200_timeline_event_media/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.
