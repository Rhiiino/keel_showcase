# Auth

Showcase Enter login, session cookies, and current-user profile endpoints.

## Purpose

Auth is Keel's identity layer. In the showcase build it creates a session for a single shared demo user via `POST /auth/showcase/login`, validates sessions via HTTP-only cookies, and exposes profile read/update for the signed-in user. Other modules depend on `get_current_user` from this module for session-protected routes.

## Module type

**Infrastructure** — consumed by every session-protected module; not a feature domain.

## HTTP API

**Prefix:** `/auth`  
**Auth:** Partial — only `GET/PATCH /auth/me` require an active session. Showcase login and logout use cookies directly.  
**Registered in:** `backend/src/main.py` → first router (`auth_router`).

| Area | Endpoints |
|------|-----------|
| Showcase | `POST /auth/showcase/login` |
| Session | `GET /auth/me`, `PATCH /auth/me` (display name and/or `picture_url`), `POST /auth/logout` |

**Env (via `core.config`):** `SHOWCASE_USER_ID`, `FRONTEND_URL`, `SESSION_SECRET`, `SESSION_COOKIE_*`, `SESSION_COOKIE_DOMAIN`, `SESSION_TTL_SECONDS`.

**Cookie scope:** By default auth cookies are **host-only** (scoped to the API hostname, e.g. `keelapi.themidhunraj.com`). Use a distinct `SESSION_COOKIE_NAME` in local dev (`keel_session_dev`) so production `keel_session` on `.themidhunraj.com` is not overwritten when both sites are open in one browser. Set `SESSION_COOKIE_DOMAIN=.themidhunraj.com` on production only if multiple production API hostnames must share one cookie.

## Frontend integration

**Frontend counterpart:** [frontend/src/modules/auth/README.md](../../../../frontend/src/modules/auth/README.md)

Login page, `RequireAuth` guard, profile menu, and session API client all call these endpoints with cookie credentials.

## Database

| Table | Purpose |
|-------|---------|
| `users` | Demo user identity, display name, linked profile `contact_id` |
| `sessions` | Cookie session tokens with expiry |

Per-user rows; sessions cascade on user delete. Showcase seeds user id `1` (`showcase@keel.demo`) via `scripts/db/seed/sql/012_showcase_user.sql`.

## Directory structure

```
auth/
├── __init__.py
├── config.py       # Route paths, cookie names
├── router.py       # Showcase login, /me, logout routes
├── service.py      # Session create/validate/invalidate
├── repository.py   # users + sessions SQL
└── schemas.py      # CurrentUserResponse, profile update DTOs
```

## Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| `router.py` | HTTP only; showcase login and cookie handling |
| `service.py` | Session lifecycle, `get_current_user` dependency |
| `repository.py` | User lookup, session insert/lookup/delete |
| `schemas.py` | Public user shape exposed to other modules |
| `config.py` | Route path constants; session cookie settings |

## Dependencies

- **core/** — `config`, `database`, `errors`, `tables`
- **Consumed by** — all modules with `Depends(get_current_user)`

## Maintenance guidelines

- Changes to session shape or `get_current_user` affect the entire API — update this README and test all protected routes.
- Update README + [`PROJECT_TREE.md`](../../../PROJECT_TREE.md) when adding routes or splitting files.

## Related documentation

- [Modules umbrella README](../README.md)
- [PROJECT_TREE.md](../../../PROJECT_TREE.md)
- Frontend: [frontend/src/modules/auth/README.md](../../../../frontend/src/modules/auth/README.md)
- Root: [README.md](../../../README.md)

## Module changelog

- **2026-07-09** — Showcase build: Google OAuth removed; `POST /auth/showcase/login` for shared demo user.
- **2026-07-05** — `PATCH /auth/me` accepts optional `picture_url`.
- **2026-06-17** — Session cookies default to host-only; document dev vs prod cookie isolation (`SESSION_COOKIE_NAME`, `SESSION_COOKIE_DOMAIN`).
- **2026-06-15** — Initial module manifest.
