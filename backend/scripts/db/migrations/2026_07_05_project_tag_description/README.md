# 2026_07_05_project_tag_description

Adds optional `description` on `project_tags` for the Projects tag catalog subpage.

## Apply (local)

From `keel_api/`:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -U keel -d keel -f - < scripts/db/migrations/2026_07_05_project_tag_description/schema.sql
```

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" -f scripts/db/migrations/2026_07_05_project_tag_description/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.

## Verify

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -U keel -d keel -c "\d project_tags"
```

Expect a nullable `description` column of type `text`.
