# coak_tags

Adds record-scoped tag catalog (`coak_tags`) and item assignments (`coak_item_tag_assignments`).

## What it does

- Creates `coak_tags` with per-record unique names and composite `(id, coak_record_id)` anchor
- Creates `coak_item_tag_assignments` linking coak items to tags within the same record

## Prerequisites

- Coak module migration (`2026_07_01_coak`) already applied
- Compatible API code deployed (or about to be tested locally)

## Local dev run

```sh
cd keel_api
MIGRATION=2026_07_04_coak_tags

docker compose -f docker-compose.yml -f docker-compose.dev.yml exec api \
  psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema.sql"
```

## Production run (Ryon)

```sh
cd keel_api
MIGRATION=2026_07_04_coak_tags

docker compose exec api psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema.sql"
```

## Verify

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('coak_tags', 'coak_item_tag_assignments');

SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'coak_tags'::regclass
ORDER BY conname;

SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'coak_item_tag_assignments'::regclass
ORDER BY conname;
```

Expected: both tables exist with constraints from `schema.sql`.

## Rollback

Not automated. Would require dropping `coak_item_tag_assignments` then `coak_tags`.
