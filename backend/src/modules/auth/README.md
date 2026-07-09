# Auth

Google OAuth login, session cookies, and current-user profile endpoints.

## Purpose

Auth is Keel's identity layer. It handles Google OAuth sign-in, session creation and validation via HTTP-only cookies, iOS token exchange, and profile read/update for the signed-in user. Other modules depend on `get_current_user` from this module for session-protected routes.

## Module type

**Infrastructure** — consumed by every session-protected module; not a feature domain.

## HTTP API

**Prefix:** `/auth`  
**Auth:** Partial — only `GET/PATCH /auth/me` require an active session. OAuth and logout use cookies or one-time codes directly.  
**Registered in:** `keel_api/src/main.py` → first router (`auth_router`).

| Area | Endpoints |
|------|-----------|
| OAuth | `GET /auth/google/login`, `GET /auth/google/callback`, `GET /auth/oauth/dismiss` |
| iOS | `POST /auth/ios/exchange` |
| Session | `GET /auth/me`, `PATCH /auth/me` (display name and/or `picture_url`), `POST /auth/logout` |

**Env (via `core.config`):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL`, `SESSION_SECRET`, `SESSION_COOKIE_*`, `SESSION_COOKIE_DOMAIN`, `SESSION_TTL_SECONDS`.

**Cookie scope:** By default auth cookies are **host-only** (scoped to the API hostname, e.g. `keelapi.themidhunraj.com`). Use a distinct `SESSION_COOKIE_NAME` in local dev (`keel_session_dev`) so production `keel_session` on `.themidhunraj.com` is not overwritten when both sites are open in one browser. Set `SESSION_COOKIE_DOMAIN=.themidhunraj.com` on production only if multiple production API hostnames must share one cookie.

## Frontend integration

**Frontend counterpart:** [keel_web/src/modules/auth/README.md](../../../../keel_web/src/modules/auth/README.md)

Login page, `RequireAuth` guard, profile menu, and session API client all call these endpoints with cookie credentials.

## Database

| Table | Purpose |
|-------|---------|
| `users` | Google identity, display name, linked profile `contact_id` |
| `sessions` | Cookie session tokens with expiry |

Per-user rows; sessions cascade on user delete.

## Directory structure

```
auth/
├── __init__.py
├── config.py       # OAuth paths, cookie names, state TTL
├── router.py       # OAuth, /me, logout routes
├── service.py      # OAuth flow, session create/validate/invalidate
├── repository.py   # users + sessions SQL
└── schemas.py      # CurrentUserResponse, profile update DTOs
```

## Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| `router.py` | HTTP only; OAuth redirects and cookie handling |
| `service.py` | Google token exchange, session lifecycle, `get_current_user` dependency |
| `repository.py` | User upsert, session insert/lookup/delete |
| `schemas.py` | Public user shape exposed to other modules |
| `config.py` | Route path constants; OAuth state cookie settings |

## Dependencies

- **core/** — `config`, `database`, `errors`, `tables`
- **Consumed by** — all modules with `Depends(get_current_user)`

## Maintenance guidelines

- Changes to session shape or `get_current_user` affect the entire API — update this README and test all protected routes.
- `DEV_USERS_PATH` / `DEV_LOGIN_PATH` exist in config but have no registered routes in production.
- Update README + [`PROJECT_TREE.md`](../../../PROJECT_TREE.md) when adding routes or splitting files.

## Related documentation

- [Modules umbrella README](../README.md)
- [PROJECT_TREE.md](../../../PROJECT_TREE.md)
- Frontend: [keel_web/src/modules/auth/README.md](../../../../keel_web/src/modules/auth/README.md)
- Root: [keel_api/README.md](../../../README.md)

## Module changelog

- **2026-07-05** — `PATCH /auth/me` accepts optional `picture_url`; OAuth re-login preserves an existing custom picture.
- **2026-06-17** — Session cookies default to host-only; document dev vs prod cookie isolation (`SESSION_COOKIE_NAME`, `SESSION_COOKIE_DOMAIN`).
- **2026-06-15** — Initial module manifest.
