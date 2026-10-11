# 2026_06_27_1600_contact_tags

Adds `contact_tags` and `contact_tag_assignments` for user-defined contact labels.

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" -f scripts/db/migrations/2026_06_27_1600_contact_tags/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.
