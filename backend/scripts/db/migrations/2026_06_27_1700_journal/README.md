# 2026_06_27_1700_journal

Adds `journal_entries`, `journal_tags`, and `journal_entry_tag_assignments` for personal journal entries.

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" -f scripts/db/migrations/2026_06_27_1700_journal/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.
