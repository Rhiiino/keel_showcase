# Services name + type uniqueness

Replaces `UNIQUE (user_id, service_name)` with `UNIQUE (user_id, service_name, service_type)` so the same name can exist once per type (Frontend and Backend).

Requires migration `2026_07_04_services_type_description`.

## Run

```sh
MIGRATION=2026_07_04_services_name_type_unique
docker compose exec api sh -c 'psql "$DATABASE_URL" -f "scripts/db/migrations/${MIGRATION}/schema.sql"'
```

## Verify

```sh
docker compose exec api sh -c 'psql "$DATABASE_URL" -c "\d services"'
```

## Rollback

```sh
docker compose exec api sh -c 'psql "$DATABASE_URL" <<'"'"'SQL'"'"'
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_user_name_type_unique;
ALTER TABLE services ADD CONSTRAINT services_user_name_unique UNIQUE (user_id, service_name);
SQL'
```
