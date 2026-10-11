# 2026-06-22 — Project canvas workspace settings

Adds `project_canvas.settings` JSONB for per-project workspace canvas UI preferences (canvas color, snap toggle, config panel open/position). Canvas content remains in `project_canvas.state`.

## Apply

From `keel_api/` (local dev uses Docker — `psql` is not required on the host):

```sh
docker compose exec api sh -c \
  'psql "$DATABASE_URL" -f scripts/db/migrations/2026_06_22_1010_project_canvas_settings/schema.sql'
```

Production (Ryon): same pattern via `docker compose exec api psql "$DATABASE_URL" -f ...` after SSH — see [docs/deployment/migration.md](../../../../docs/deployment/migration.md).

## Verify

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'project_canvas'
  AND column_name = 'settings';

SELECT conname
FROM pg_constraint
WHERE conname = 'project_canvas_settings_object';
```

Expect one `settings` column (`jsonb`, default `'{}'::jsonb`) and the check constraint row.

## Rollback

Not automated. Drop the constraint and column:

```sql
ALTER TABLE project_canvas DROP CONSTRAINT IF EXISTS project_canvas_settings_object;
ALTER TABLE project_canvas DROP COLUMN IF EXISTS settings;
```
