# 2026_07_09_contacts_user_scope

Add `user_id` to `contacts` and `contact_relationships`; assign existing rows to user 1; per-user self-contact unique index.

## Apply (local)

From `keel_api/`:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -U keel -d keel -f - < scripts/db/migrations/2026_07_09_contacts_user_scope/schema.sql
```

## Apply (production)

```bash
docker compose exec api psql "$DATABASE_URL" -f scripts/db/migrations/2026_07_09_contacts_user_scope/schema.sql
```

Fresh local volumes pick up the same DDL from `scripts/db/init/001_schema.sql`.

## Verify

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -U keel -d keel -c "\d contacts"
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -U keel -d keel -c "SELECT user_id, COUNT(*) FROM contacts GROUP BY user_id;"
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -U keel -d keel -c "SELECT user_id, COUNT(*) FROM contact_relationships GROUP BY user_id;"
```

Expect `user_id NOT NULL` on both tables, with existing rows assigned to user 1.
