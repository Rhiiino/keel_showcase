# coak_record_workspace

Moves per-record Coak workspace blobs from `user_preferences.data.coak` onto `coak_records` JSONB columns.

## What it does

- Adds `workspace_state`, `workspace_settings`, and `configuration_settings` JSONB columns to `coak_records`
- Backfills existing preference data keyed by record id
- Removes the `coak` key from `user_preferences.data`

## Prerequisites

- Coak module migration (`2026_07_01_coak`) already applied
- Compatible API code deployed (reads/writes the new columns)

## Local dev run

```sh
cd keel_api
MIGRATION=2026_07_02_coak_record_workspace

docker compose -f docker-compose.yml -f docker-compose.dev.yml exec api \
  psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema.sql"
```

## Production run (Ryon)

```sh
cd keel_api
MIGRATION=2026_07_02_coak_record_workspace

docker compose exec api psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema.sql"
```

## Verify

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'coak_records'
  AND column_name IN ('workspace_state', 'workspace_settings', 'configuration_settings');

SELECT id, workspace_state, workspace_settings, configuration_settings
FROM coak_records
LIMIT 5;

SELECT user_id, data ? 'coak' AS has_coak_key
FROM user_preferences;
```

## Rollback

Not automated. Would require re-merging column data into `user_preferences.data.coak` before dropping columns.
