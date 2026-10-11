# 2026_07_06_finance

Rename Shop module tables to Finance; add obligations, payment methods, and obligation tags.

## Apply (local)

From `keel_api/`:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -U keel -d keel -f - < scripts/db/migrations/2026_07_06_finance/schema.sql
```

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" -f scripts/db/migrations/2026_07_06_finance/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.

## Verify

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -U keel -d keel -c "\dt finance_*"
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -U keel -d keel -c "SELECT COUNT(*) FROM finance_purchases;"
```

Expect nine `finance_*` tables. Row counts on renamed tables should match pre-migration shop counts.
