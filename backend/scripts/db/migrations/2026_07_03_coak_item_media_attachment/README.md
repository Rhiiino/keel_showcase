# coak_item_media_attachment

Removes the `file` item kind and allows optional `media_id` on `folder`, `note`, and `flash` items.

## What it does

- Converts existing `kind = 'file'` rows to `kind = 'note'` (preserves `media_id` and `note_body`)
- Drops `coak_items_kind_fields_valid` (media is no longer kind-gated)
- Updates `coak_items_kind_valid` to allow only `folder`, `note`, `flash`

## Prerequisites

- Coak module migration (`2026_07_01_coak`) already applied
- Compatible API code deployed (or about to be tested locally)

## Local dev run

```sh
cd keel_api
MIGRATION=2026_07_03_coak_item_media_attachment

docker compose -f docker-compose.yml -f docker-compose.dev.yml exec api \
  psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema.sql"
```

## Production run (Ryon)

```sh
cd keel_api
MIGRATION=2026_07_03_coak_item_media_attachment

docker compose exec api psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema.sql"
```

## Verify

```sql
SELECT COUNT(*) AS file_rows FROM coak_items WHERE kind = 'file';

SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'coak_items'::regclass
  AND conname = 'coak_items_kind_valid';

SELECT conname
FROM pg_constraint
WHERE conrelid = 'coak_items'::regclass
  AND conname = 'coak_items_kind_fields_valid';
```

Expected: `file_rows = 0`, `coak_items_kind_valid` allows only folder/note/flash, no `coak_items_kind_fields_valid` constraint.

## Rollback

Not automated. Would require re-adding `file` to the kind CHECK and restoring kind-field constraints if no media-attached non-file rows exist.
