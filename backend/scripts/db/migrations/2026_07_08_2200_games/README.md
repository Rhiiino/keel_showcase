# Migration: Games module tables

Adds `game_sessions` and `game_stats` for the solo mini-games module.

## Apply (local existing volume)

From `keel_api/` with the stack running:

```sh
docker compose exec -T db psql -U keel -d keel -f - < scripts/db/migrations/2026_07_08_2200_games/schema.sql
```

## Verify

```sh
docker compose exec -T db psql -U keel -d keel -c "\d game_sessions"
docker compose exec -T db psql -U keel -d keel -c "\d game_stats"
```

Expected: both tables exist; `game_sessions_active_level_uq` partial unique index present.
