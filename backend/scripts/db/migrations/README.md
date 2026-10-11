# keel_api/scripts/db/migrations/README.md

Production database migrations for Keel. One timestamped folder per change.

## When to use migrations vs seed files

| Use case | Location |
|----------|----------|
| Fresh database bootstrap (catalog, home quotes, init schema) | `scripts/db/init/` and `scripts/db/seed/` |
| One-off production key data (contacts, Focus origin) | `scripts/db/seed/prod_seed_key_data.py` |
| **Live production schema or data change after go-live** | `scripts/db/migrations/` |

Seed files run only when Postgres creates a new volume (`docker-entrypoint-initdb.d`). They do **not** alter an existing production database. After go-live, use migration folders for intentional production changes.

## Folder layout

One folder per production change:

```text
scripts/db/migrations/
├── README.md
└── YYYY_MM_DD_HHMM_short_description/
    ├── README.md      # runbook for this migration
    ├── schema.sql     # optional — production schema change
    └── data.py        # optional — production data backfill/repair/insert
```

Include only the files needed for that change. A data-only repair may have just `data.py` and `README.md`.

### Naming convention

```text
YYYY_MM_DD_HHMM_short_description
```

Examples:

```text
2026_06_12_2215_add_focus_item_priority/
2026_06_20_0930_backfill_contact_photos/
2026_07_02_1800_add_settings_defaults/
```

Use local time when creating the folder. Keep the description short and snake_case.

## What goes in each file

### `schema.sql`

Production-safe DDL for an existing database. Also update `scripts/db/init/001_schema.sql` so fresh volumes get the same shape.

Prefer idempotent SQL where practical:

```sql
ALTER TABLE focus_list_items
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal';
```

### `data.py`

One-time data logic: backfills, repairs, inserts, media sync. Use `asyncpg` and read `DATABASE_URL` from the environment (same pattern as `scripts/db/seed/prod_seed_key_data.py`).

Make scripts idempotent when possible (`WHERE NOT EXISTS`, `ON CONFLICT DO NOTHING`, sentinel checks).

### Per-migration `README.md`

Document for that specific change:

- What the migration does and why
- Prerequisites (code deployed? user signed in? assets on disk?)
- Exact run commands
- Verification queries (row counts, sample rows)
- Rollback notes if relevant

## Recommended run order

For most changes:

1. **Schema migration** (if `schema.sql` exists) — run against production before or with compatible code
2. **Deploy code** — pull on Ryon, rebuild/restart API
3. **Data migration** (if `data.py` exists) — run once after schema + code are in place
4. **Verify** — use queries from the migration README

For risky changes, split into two deploys: add schema in a backward-compatible way, deploy code, run data migration, then remove legacy schema/code later.

**Rule:** the production database must be shaped so the deployed code can run without crashing.

## Running migrations on Ryon

After `git pull` and `docker compose up -d --build` in `keel_api/`:

```sh
cd keel_api
MIGRATION=2026_06_12_2215_add_focus_item_priority

# Schema (if present)
docker compose exec api psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema.sql"

# Data (if present)
docker compose exec api python \
  "scripts/db/migrations/${MIGRATION}/data.py"
```

Run commands from the migration folder's own `README.md` when order or timing differs.

## Safety expectations

- **Idempotent where possible** — safe to re-run after a partial failure
- **Scoped** — affect only the rows/tables this change needs
- **Verified** — include verification queries in the migration README
- **No experiments on production** — test on a local restore first (see `keel_api/README.md` → Local Development with Production Backup)
- **Never restore local/test dumps onto production**
- **Update init schema** — keep `001_schema.sql` in sync for fresh databases
- **Log the change** — add a bullet to `CHANGELOG.md` at repo root in the PR's dated section (same PR as the migration)

## Example migration folder

```text
2026_06_12_2215_add_focus_item_priority/
├── README.md
├── schema.sql
└── data.py
```

`schema.sql` adds a `priority` column. `data.py` backfills existing rows. The migration README lists exact commands and a `SELECT COUNT(*)` verification query.

See also: [keel_api/README.md](../../../README.md) for production deploy workflows and local backup restore.
