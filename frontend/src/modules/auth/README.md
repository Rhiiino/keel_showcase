# Auth

Session management, Google OAuth login, route guards, and profile shell chrome.

## Purpose

Auth handles how users sign in and stay signed in. It provides the login page, session check API, `RequireAuth` route guard used app-wide, and profile menu components (avatar, settings link, logout). The home nav icon is also exported from this module.

## Module type

**Cross-cutting** — login route plus infrastructure consumed across the app.

## Routes and navigation

| Path | Page | Notes |
|------|------|-------|
| `/login` | `LoginPage` (variant dispatcher) | Wrapped in `RedirectIfAuthed` |

**Nav:** `homeNavItem` exported from `navItem.tsx` — title Home, href `/`, not an auth-specific entry.

**Registered in:** `manifest.ts` (`publicRoutes` + home nav item) → [`app/modules/registry.ts`](../../app/modules/registry.ts). `RequireAuth` wraps all shell routes.

**Auth:** `RequireAuth` redirects unauthenticated users; login route redirects if already authed.

## Backend integration

| Endpoints | Purpose |
|-----------|---------|
| `GET/PATCH /auth/me` | Current user profile |
| `POST /auth/logout` | End session |
| `GET /auth/google/login` | OAuth redirect URL |

**Backend counterpart:** `keel_api/src/modules/auth/`

## Directory structure

```
auth/
├── api.ts
├── lib/
│   ├── loginConfig.ts   # ACTIVE_LOGIN_VARIANT global switch
│   └── loginScatterPlacement.ts
├── navItem.tsx          # Exports homeNavItem (Home icon)
├── routes.tsx           # authLoginRoute fragment
├── components/
│   ├── RequireAuth.tsx, RedirectIfAuthed.tsx
│   ├── GoogleSignInButton.tsx
│   ├── ProfileMenu.tsx, UserAvatar.tsx
│   └── login/
│       ├── classic/
│       │   └── LoginLightningSky.tsx
│       └── scatter/
│           ├── LoginScatterAmbience.tsx
│           └── LoginScatterSpot.tsx
└── pages/
    ├── LoginPage.tsx    # Dispatches to active login variant
    └── login/
        ├── registry.ts
        ├── ClassicLoginScreen.tsx
        ├── EmberLoginScreen.tsx
        ├── GrayLoginScreen.tsx
        └── ScatterLoginScreen.tsx
```

## Login variants

Multiple login screens live under `pages/login/`. The active screen is chosen globally in [`lib/loginConfig.ts`](lib/loginConfig.ts) via `ACTIVE_LOGIN_VARIANT`.

| Variant id | Screen | Notes |
|------------|--------|-------|
| `classic` | `ClassicLoginScreen` | 3D Keel model, lightning sky, staggered entrance |
| `ember` | `EmberLoginScreen` | Ember gradient, random Keel Persona animation |
| `gray` | `GrayLoginScreen` | Gray gradient, Keel logo image |
| `scatter` | `ScatterLoginScreen` | Gray gradient + **K E E L** title; persona + quip teleport between random viewport positions |

**Add a new variant:**

1. Create `pages/login/{Name}LoginScreen.tsx` (include `GoogleSignInButton`).
2. Add the id to `LOGIN_VARIANTS` in `loginConfig.ts`.
3. Register the component in `pages/login/registry.ts`.
4. Set `ACTIVE_LOGIN_VARIANT` to the new id.

Variant-specific components and styles belong under `components/login/{variant}/` (or co-located with the screen). Shared sign-in chrome stays in `components/`.

## Key concepts

- **RequireAuth** — layout route in `app/routes.tsx`; all feature modules mount beneath it.
- **Profile menu** — entry point to `/settings`; lives in app shell header via auth components.
- **Home nav** — intentionally colocated here because home is the post-login landing target.

## Dependencies

- **agents** — decorative 3D model on login page
- Consumed by **app shell**, **home**, **settings**, and every authenticated route

## Maintenance guidelines

- Do not put feature UI in auth; keep guards and session chrome only.
- Changes to `RequireAuth` or session API affect the entire app — update this README and test all shell routes.

## Related documentation

- [Modules umbrella README](../README.md)
- [PROJECT_TREE.md](../../PROJECT_TREE.md)
- Backend: `keel_api/src/modules/auth/`

## Module changelog

- **2026-07-09** — `scatter` login variant: persona cluster teleports between positions (flash out/in) instead of zip motion.
- **2026-07-09** — `ember` login variant: ember gradient, random Keel Persona animation, Google sign-in.
- **2026-07-09** — Login screen variant registry and `ACTIVE_LOGIN_VARIANT` config; classic screen extracted from `LoginPage`.
- **2026-06-15** — Initial module manifest.
