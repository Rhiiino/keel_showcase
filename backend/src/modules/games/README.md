# Games module (backend)

Solo mini-games: resumable sessions and per-user stats. Game catalog lives in frontend code; backend validates `game_key` and persists JSONB state.

## HTTP API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/games/stats?game_key=` | Personal stats for one game |
| GET | `/games/sessions/resume?game_key=` | Most recent in-progress session |
| GET | `/games/sessions/active?game_key=&level=` | In-progress session for a level |
| POST | `/games/sessions` | Start or return existing level session |
| PATCH | `/games/sessions/{id}` | Autosave state |
| POST | `/games/sessions/{id}/complete` | Complete level and update stats |
| POST | `/games/sessions/{id}/restart` | Reset level layout |

## Registered games

- `tower-of-hanoi` — levels 1–15, disk count `2 + level`

## Database

- `game_sessions` — user-scoped play state (JSONB)
- `game_stats` — aggregated bests per user per game

## Module changelog

**2026-07-08** — Initial games module with Tower of Hanoi support.
