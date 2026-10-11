# Focus work order and unified status

## What this migration does

- Adds nullable `focus_nodes.work_order` for manual execution ordering.
- Backfills `focus_nodes.status` for list/record nodes from legacy `list_status`.
- Expands shared `status` values to `active`, `paused`, `completed`, `archived`, and `limbo`.
- Moves existing focus nodes into `limbo` so status-based constellation glows start quiet after deploy.
- Drops `focus_nodes.list_status`.

## Run

From `keel_api/`:

```sh
MIGRATION=2026_06_14_1328_focus_work_order_unified_status
docker compose exec api psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema.sql"
```

## Verify

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'focus_nodes'
  AND column_name IN ('work_order', 'status', 'list_status')
ORDER BY column_name;

SELECT kind, status, COUNT(*) AS count
FROM focus_nodes
GROUP BY kind, status
ORDER BY kind, status;
```

Expected: `work_order` and `status` exist, `list_status` does not.
