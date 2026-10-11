# 2026_07_07_finance_transactions

Rename `finance_purchases` to `finance_transactions`; add `kind` and `obligation_id`; rename tag tables and entity-type strings.

## Apply (local)

From `keel_api/`:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -U keel -d keel -f - < scripts/db/migrations/2026_07_07_finance_transactions/schema.sql
```

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" -f scripts/db/migrations/2026_07_07_finance_transactions/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.

## Verify

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -U keel -d keel -c "\d finance_transactions"
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -U keel -d keel -c "SELECT kind, COUNT(*) FROM finance_transactions GROUP BY kind;"
```

Expect `finance_transactions` (not `finance_purchases`), `kind` column with existing rows as `physical`.
