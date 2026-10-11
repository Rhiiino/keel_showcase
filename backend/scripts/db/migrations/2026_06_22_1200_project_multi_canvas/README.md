# 2026-06-22 — Project multi-canvas

Allows multiple `project_canvas` rows per project. Adds `name`, `sort_order`, and `is_default`; drops the unique constraint on `project_id`.

## Apply

From `keel_api/` (local dev uses Docker):

```sh
docker compose exec api sh -c \
  'psql "$DATABASE_URL" -f scripts/db/migrations/2026_06_22_1200_project_multi_canvas/schema.sql'
```

Production (Ryon): same pattern via `docker compose exec api psql "$DATABASE_URL" -f ...` after SSH — see [docs/deployment/migration.md](../../../../docs/deployment/migration.md).

## Verify

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'project_canvas'
  AND column_name IN ('name', 'sort_order', 'is_default');

SELECT indexname
FROM pg_indexes
WHERE tablename = 'project_canvas'
  AND indexname = 'idx_project_canvas_one_default_per_project';

SELECT conname
FROM pg_constraint
WHERE conrelid = 'project_canvas'::regclass
  AND conname = 'project_canvas_project_id_key';
```

Expect the three columns, the partial unique index, and **no** `project_canvas_project_id_key` constraint.

## Rollback

Not automated. Reversing requires consolidating to one canvas per project before re-adding `UNIQUE (project_id)`.
