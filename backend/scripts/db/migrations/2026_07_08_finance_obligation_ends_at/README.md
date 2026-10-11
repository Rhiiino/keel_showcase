# 2026_07_08_finance_obligation_ends_at

Add optional `ends_at` to `finance_obligations` for when a subscription or service ends.

## Apply (local)

From `keel_api/`:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -U keel -d keel -f - < scripts/db/migrations/2026_07_08_finance_obligation_ends_at/schema.sql
```

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" -f scripts/db/migrations/2026_07_08_finance_obligation_ends_at/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.

## Verify

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -U keel -d keel -c "\d finance_obligations" | grep ends_at
```

Expect nullable `ends_at TIMESTAMPTZ` column.
