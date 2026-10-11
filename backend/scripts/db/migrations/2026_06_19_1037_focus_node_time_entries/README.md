# keel_api/scripts/db/migrations/2026_06_19_1037_focus_node_time_entries/README.md

# Focus Node Time Entries

Adds `focus_node_time_entries`, a user-owned child table for start/pause/resume/end timer sessions on focus nodes.

## Apply

```bash
docker compose exec api psql "$DATABASE_URL" -f scripts/db/migrations/2026_06_19_1037_focus_node_time_entries/schema.sql
```

## Verify

```sql
SELECT to_regclass('public.focus_node_time_entries');
SELECT indexname
FROM pg_indexes
WHERE tablename = 'focus_node_time_entries'
ORDER BY indexname;
```

## Rollback

```sql
DROP TABLE IF EXISTS focus_node_time_entries;
```
