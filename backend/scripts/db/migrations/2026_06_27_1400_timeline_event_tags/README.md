# 2026_06_27_1400_timeline_event_tags

Adds `timeline_tags` and `timeline_event_tag_assignments` for user-defined timeline event labels.

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" -f scripts/db/migrations/2026_06_27_1400_timeline_event_tags/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.
