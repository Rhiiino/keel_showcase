# 2026-06-21 — Project folders

Adds `project_folders` for nested file organization inside a project's Files section, and `media_attachments.project_folder_id` to place gallery attachments in a project folder.

## Apply

From `keel_api/` (local dev uses Docker — `psql` is not required on the host):

```sh
docker compose exec api sh -c \
  'psql "$DATABASE_URL" -f scripts/db/migrations/2026_06_21_project_folders/schema.sql'
```

Use `sh -c '...'` so `DATABASE_URL` is read from inside the `api` container (host `$DATABASE_URL` often points at localhost and will fail).

Production (Ryon): same pattern via `docker compose exec api psql "$DATABASE_URL" -f ...` after SSH — see [docs/deployment/migration.md](../../../../docs/deployment/migration.md).

## Rollback

Not automated. Drop `media_attachments.project_folder_id`, then `project_folders`.
