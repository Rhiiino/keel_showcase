# user_contact_id

Adds `users.contact_id` — a foreign key to `contacts` representing the contact record
associated with the logged-in user (birth date and other profile fields).

## What it does

- Adds nullable `users.contact_id` referencing `contacts(id)` with `ON DELETE SET NULL`
- Seeds `users.id = 1` → `contact_id = 4` for local dev

## Prerequisites

- Contacts module tables exist (`contacts` table)

## Local dev run

```sh
cd keel_api
MIGRATION=2026_07_02_user_contact_id

docker compose -f docker-compose.yml -f docker-compose.dev.yml exec api \
  psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema.sql"
```

## Production run (Ryon)

```sh
cd keel_api
MIGRATION=2026_07_02_user_contact_id

docker compose exec api psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema.sql"
```

## Verify

```sql
SELECT id, contact_id FROM users WHERE id = 1;

SELECT id, birth_date, birth_date_year_known
FROM contacts
WHERE id = 4;
```

## Rollback

Not automated. Would require dropping the column after clearing references.
