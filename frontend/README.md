# Frontend

Vite + React web app for **Keel Showcase**.

## Stack

- React 18, TypeScript, Vite
- React Router, TanStack Query
- Tailwind CSS, Framer Motion

## Environment

Configuration is in [`frontend/.env`](.env):

| Variable | Purpose |
|----------|---------|
| `VITE_DEV_PORT` | Vite dev server port (default `5173`) |
| `VITE_PREVIEW_PORT` | Vite preview port for production builds (default `5177`) |
| `VITE_API_BASE_URL` | Backend API origin |

For local dev against Docker backend: `VITE_API_BASE_URL=http://127.0.0.1:9092`

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

Set `VITE_API_BASE_URL` to your production API URL **before** `npm run build` so the bundle points at the correct backend.

## Module architecture

Feature modules live under `src/modules/`. Each module exports a `manifest.ts` registered in `src/app/modules/registry.ts`.

Login screen variant is configured in `src/modules/auth/lib/loginConfig.ts` (showcase default: **scatter**).
