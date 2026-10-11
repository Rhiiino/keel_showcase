# 2026_06_30_timeline_tag_description

Adds optional `description` on `timeline_tags` for tag catalog notes.

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" -f scripts/db/migrations/2026_06_30_timeline_tag_description/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.

## Verify

```bash
docker compose exec api psql "$DATABASE_URL" -c "\d timeline_tags"
```

Expect a nullable `description` column of type `text`.
