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
| `VITE_DEV_PUBLIC_ORIGIN` | Public HTTPS origin for dev behind Caddy (enables HMR over `wss://`) |
| `VITE_API_BASE_URL` | Backend API origin |

For local dev against Docker backend: `VITE_API_BASE_URL=http://127.0.0.1:9092`

## Development

```bash
npm install
npm run dev
```

### Dev server on the public domain

Caddy routes `https://keel.themidhunraj.com` to `127.0.0.1:5177` on the VPS. Matching `VITE_DEV_PORT` to `5177` is necessary, but not sufficient on its own.

1. **Run dev on the VPS** (the machine Caddy points at). Running `npm run dev` on your laptop will not change what the domain serves.
2. **Stop preview first** — only one process can bind to port `5177`:
   ```bash
   pkill -f "vite preview.*5177" || true
   ```
3. **Set in `frontend/.env`:**
   ```env
   VITE_DEV_PORT=5177
   VITE_DEV_PUBLIC_ORIGIN=https://keel.themidhunraj.com
   ```
   `VITE_DEV_PUBLIC_ORIGIN` tells Vite to use secure WebSocket HMR through Caddy (`wss://` on port 443).
4. **Start dev:**
   ```bash
   npm run dev
   ```

For local-only development without the domain, omit `VITE_DEV_PUBLIC_ORIGIN` and use the default dev port `5173`.

## Production build

```bash
npm run build
npm run preview
```

Set `VITE_API_BASE_URL` to your production API URL **before** `npm run build` so the bundle points at the correct backend.

## Module architecture

Feature modules live under `src/modules/`. Each module exports a `manifest.ts` registered in `src/app/modules/registry.ts`.

Login screen variant is configured in `src/modules/auth/lib/loginConfig.ts` (showcase default: **scatter**).
