# Services health monitors table

Adds the `services` table for HTTP URL health checks (up / caution / down).

## Run

```sh
MIGRATION=2026_07_03_services
docker compose exec api psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema.sql"
```

## Verify

```sh
docker compose exec api psql "$DATABASE_URL" -c "\d services"
```

## Rollback

```sh
docker compose exec api psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS services;"
```
