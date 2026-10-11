# keel_api/scripts/db/migrations/2026_06_20_general_updates/README.md

# 2026-06-20 general updates (combined production migration)

Single production migration package for all schema changes shipped on **2026-06-20**. Replaces the individual folders:

- `2026_06_20_media_objects`
- `2026_06_20_media_folders`
- `2026_06_20_media_panels`
- `2026_06_20_media_panel_item_border`
- `2026_06_20_media_panel_item_preview`
- `2026_06_20_focus_reference_target_text`
- `2026_06_20_focus_show_reference_content`

Fresh installs that already use `scripts/db/init/001_schema.sql` do **not** need this migration. Use it when upgrading an existing production database.

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | All 2026-06-20 schema changes in dependency order |
| `data.py` | Copy legacy filesystem media into Garage; insert `media_objects` + `media_attachments` |
| `schema_cleanup.sql` | Drop legacy media tables and inline cover/photo/image columns |

## What `schema.sql` applies

1. **Unified media** — `media_objects`, `media_attachments`
2. **Media folders** — `media_folders`, `media_objects.folder_id`
3. **Media panels** — `media_panels`, `media_panel_items`
4. **Panel tile options** — `border_color`, `preview_scale`, `preview_focal_x`, `preview_focal_y`
5. **Focus references** — `focus_nodes.reference_target_id` as `TEXT`, `show_reference_content`

## Production upgrade (sequential)

Set the migration folder:

```sh
MIGRATION=2026_06_20_general_updates
```

### 1. Pull code on Ryon

```sh
ssh mittens@ryon
cd ~/Documents/myrepos/keel_ai
git checkout main
git pull
cd keel_api
git checkout main
git pull
```

### 2. Review migration files

```sh
ls "scripts/db/migrations/${MIGRATION}"
```

### 3. Apply schema

```sh
docker compose exec api psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema.sql"
```

### 4. Rebuild/restart backend (Garage + S3 env must be live)

```sh
docker compose up -d --build
docker compose ps
docker compose logs api --tail 50
```

### 5. Run data migration

Requires legacy `PROJECTS_MEDIA_PATH`, `SHOP_MEDIA_PATH`, and `CONTACTS_MEDIA_PATH` if files remain on disk.

```sh
docker compose exec api python "scripts/db/migrations/${MIGRATION}/data.py"
```

Skip if no legacy media rows exist (script prints a no-op message).

### 6. Apply schema cleanup

```sh
docker compose exec api psql "$DATABASE_URL" \
  -f "scripts/db/migrations/${MIGRATION}/schema_cleanup.sql"
```

### 7. Deploy frontend

```sh
cd ~/Documents/myrepos/keel_ai/keel_web
git checkout main
git pull
npm install
npm run build
npm run start
```

### 8. Verify

```sql
SELECT to_regclass('public.media_objects');
SELECT to_regclass('public.media_folders');
SELECT to_regclass('public.media_panels');
SELECT to_regclass('public.project_media');
SELECT data_type
FROM information_schema.columns
WHERE table_name = 'focus_nodes' AND column_name = 'reference_target_id';
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'focus_nodes' AND column_name = 'show_reference_content';
```

Spot-check:

- `GET /media` lists files
- `GET /media/panels` returns panels
- Focus constellation can link a Media object reference and toggle **Show media content**

## Rollback

Not supported without restoring from backup — `schema_cleanup.sql` drops legacy media tables and columns.
