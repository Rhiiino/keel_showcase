# 2026_07_05_timeline_planner

Adds `timeline_plans` and `timeline_plan_items` for forward-looking period planning inside Timeline. Repurposes `timeline_event_tag_assignments` as `timeline_tag_assignments` (events + plan items).

## Apply (local dev)

From `keel_api/` with the dev stack running:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db \
  psql -U keel -d keel -f - \
  < scripts/db/migrations/2026_07_05_timeline_planner/schema.sql
```

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" \
  -f scripts/db/migrations/2026_07_05_timeline_planner/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.

## Verify

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db \
  psql -U keel -d keel -c "\d timeline_plans"

docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db \
  psql -U keel -d keel -c "\d timeline_plan_items"

docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db \
  psql -U keel -d keel -c "\d timeline_tag_assignments"
```

Confirm `timeline_event_tag_assignments` no longer exists and existing event tag rows remain (`timeline_event_id` set, `timeline_plan_item_id` NULL).

If a prior apply failed on `ALTER COLUMN timeline_event_id DROP NOT NULL` (PK must be dropped first), run:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db \
  psql -U keel -d keel -c "ALTER TABLE timeline_tag_assignments ALTER COLUMN timeline_event_id DROP NOT NULL;"
```
