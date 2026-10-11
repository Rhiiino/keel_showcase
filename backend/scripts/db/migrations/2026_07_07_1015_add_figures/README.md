# 2026_07_07_1015_add_figures

Adds `figures` and `timeline_event_figures` tables, and extends `media_attachments.entity_type` to allow `figure` profile photos.

## Apply (dev)

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db \
  psql -U keel -d keel -f - < keel_api/scripts/db/migrations/2026_07_07_1015_add_figures/schema.sql
```

## Verify

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db \
  psql -U keel -d keel -c "\d figures"
```
