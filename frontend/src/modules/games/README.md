# Games module (frontend)

Lobby of solo mini-games with a code-defined catalog. User progress persists via `/games/*` API.

## Routes and navigation

| Path | Page |
|------|------|
| `/games` | Games lobby (card grid) |
| `/games/:gameKey` | Game play shell |

Nav item: **Games** (`/games`), accent lime.

## Directory structure

```
games/
├── manifest.ts, routes.tsx, navItem.tsx, api.ts
├── gameRegistry.ts
├── pages/           GamesLobbyPage, GamePlayPage
├── components/      GameCard
├── hooks/           useGameSession
└── games/
    └── tower-of-hanoi/
        ├── TowerOfHanoiGame.tsx
        ├── components/
        ├── hooks/
        └── lib/
```

## Backend integration

- `GET /games/sessions/resume` — resume on card click
- `GET /games/sessions/active` — load level session
- `POST /games/sessions` — start level
- `PATCH /games/sessions/{id}` — debounced autosave
- `POST /games/sessions/{id}/complete` — win + stats
- `POST /games/sessions/{id}/restart` — reset level

## Dependencies

| Module | Import | Purpose |
|--------|--------|---------|
| `focus` | `lib/appearance.ts` | Glass card styling on lobby `GameCard` |

## Module changelog

**2026-07-09** — Games lobby card glass styling (Focus/C.O.A.K. pattern); Tower of Hanoi timer starts on first move.

**2026-07-08** — Initial games module with Tower of Hanoi (15 levels, drag-and-snap).
