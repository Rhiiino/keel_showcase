# 2026_06_30_journal_entry_media

Extends `media_attachments.entity_type` CHECK to allow `journal_entry` for gallery files on journal entries.

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" -f scripts/db/migrations/2026_06_30_journal_entry_media/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.
