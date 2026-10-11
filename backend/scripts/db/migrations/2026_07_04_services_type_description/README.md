# Services type and description

Adds `service_type` (`frontend` | `backend`) and optional `description` to `services`.

## Run

```sh
MIGRATION=2026_07_04_services_type_description
docker compose exec api psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema.sql"
```

## Verify

```sh
docker compose exec api psql "$DATABASE_URL" -c "\d services"
```

## Rollback

```sh
docker compose exec api psql "$DATABASE_URL" <<'SQL'
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_service_type_valid;
ALTER TABLE services DROP COLUMN IF EXISTS description;
ALTER TABLE services DROP COLUMN IF EXISTS service_type;
SQL
```
