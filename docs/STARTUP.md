# Starting and stopping Keel Showcase

Commands assume deployment on a Hetzner VPS (same pattern as other portfolio projects under `/root/myrepos/`).

## URLs and ports

| Public URL | Local bind | Service |
|------------|------------|---------|
| `https://keel.themidhunraj.com` | `127.0.0.1:5177` | Frontend (Vite preview) |
| `https://keelapi.themidhunraj.com` | `127.0.0.1:9092` | FastAPI backend |

Configure Caddy (or your reverse proxy) to route those hostnames to the local ports above.

## Configuration

| File | Key variables |
|------|---------------|
| `backend/.env` | `SHOWCASE_USER_ID`, `SESSION_SECRET`, `OPENAI_API_KEY`, `S3_*`, `FRONTEND_URL`, `CORS_EXTRA_ORIGINS` |
| `frontend/.env` | `VITE_DEV_PORT`, `VITE_PREVIEW_PORT`, `VITE_API_BASE_URL` |

Before first deploy, fill in on the server:

1. `SESSION_SECRET` (random string — required for login cookies)
2. `OPENAI_API_KEY` (and other LLM keys as needed)
3. `S3_ACCESS_KEY` and `S3_SECRET_KEY` (after Garage initialization)

The shared demo user is seeded automatically as `showcase@keel.demo` (`SHOWCASE_USER_ID=1`). Visitors click **Enter** on the login screen — no OAuth setup.

---

## Backend (Docker Compose)

From the repo root:

### Start

```bash
cd /root/myrepos/keel_showcase
docker compose --env-file backend/.env up --build -d
```

### Stop

```bash
docker compose --env-file backend/.env down
```

### Verify

```bash
curl http://127.0.0.1:9092/health
```

### Logs

```bash
docker compose logs -f api
docker compose logs -f worker
```

---

## Frontend

### Local development (hot reload)

Requires the backend to be running.

```bash
cd /root/myrepos/keel_showcase/frontend
npm install
npm run dev
```

Dev server: `http://127.0.0.1:5173`

### Production preview

Ensure `frontend/.env` has `VITE_API_BASE_URL=https://keelapi.themidhunraj.com` before building.

```bash
cd /root/myrepos/keel_showcase/frontend
npm run build
npm run preview
```

Preview: `http://127.0.0.1:5177`

Background preview:

```bash
nohup npm run preview >> /tmp/keel-showcase-preview.log 2>&1 &
```

Stop: `pkill -f "vite preview.*5177"`

---

## First-time checklist

1. Clone repo to `/root/myrepos/keel_showcase`
2. Set `SESSION_SECRET` in `backend/.env`
3. Configure DNS + Caddy for `keel` and `keelapi` subdomains
4. Start backend with Docker Compose
5. Initialize Garage bucket and S3 keys (see backend scripts under `backend/scripts/`)
6. Build and start frontend preview
7. Open the site, click **Enter** on the login screen
8. Optionally seed demo data: set `DEMO_SEED_ENABLED=true` and `DEMO_USER_EMAIL=showcase@keel.demo` in `backend/.env`, then run the demo seed script

---

## Quick reference

| Service | Start | Stop |
|---------|-------|------|
| Backend stack | `docker compose --env-file backend/.env up -d` | `docker compose --env-file backend/.env down` |
| Frontend dev | `npm run dev` | Ctrl+C |
| Frontend prod | `npm run build && npm run preview` | `pkill -f "vite preview.*5177"` |
