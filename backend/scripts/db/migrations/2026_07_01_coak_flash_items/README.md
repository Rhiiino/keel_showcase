# coak_flash_items

Adds the `flash` item kind and `flash_front` / `flash_back` columns to `coak_items`.

## What it does

- Adds `flash_front` and `flash_back` text columns (default empty string)
- Extends `coak_items_kind_valid` to allow `kind = 'flash'`
- Extends `coak_items_kind_fields_valid` so flash items have no `media_id`

## Prerequisites

- Coak module migration (`2026_07_01_coak`) already applied
- Compatible API code deployed (or about to be tested locally)

## Local dev run

```sh
cd keel_api
MIGRATION=2026_07_01_coak_flash_items

docker compose -f docker-compose.yml -f docker-compose.dev.yml exec api \
  psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema.sql"
```

## Production run (Ryon)

```sh
cd keel_api
MIGRATION=2026_07_01_coak_flash_items

docker compose exec api psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema.sql"
```

## Verify

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'coak_items'
  AND column_name IN ('flash_front', 'flash_back');

SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'coak_items'::regclass
  AND conname IN ('coak_items_kind_valid', 'coak_items_kind_fields_valid');
```

## Rollback

Not automated. Would require dropping columns and restoring prior CHECK constraints if no flash rows exist.
