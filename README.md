# Keel Showcase

**Live demo:** [keel.themidhunraj.com](https://keel.themidhunraj.com)

Keel is a modular full-stack personal productivity platform: Google OAuth sessions, multi-agent SSE chat with LLM tool orchestration, project workspace canvases, a focus constellation graph, media storage, and feature modules for finance, contacts, timeline, journal, email, and more.

This repository is a **standalone public showcase** of the Keel web app and API — self-contained with no dependency on other repos.

## Features

See [docs/MODULES.md](docs/MODULES.md) for the full module list. Highlights:

- **Modular monolith** — manifest-based frontend and backend registries; add or remove feature slices without rewiring the shell
- **SSE chat** — streaming LLM conversations with native tool calls
- **Agents & intelligence** — catalog-driven agent editor and models/tools browser
- **Projects** — kanban gallery and Obsidian-style infinite workspace canvas
- **Focus** — task lists with card hub and interactive constellation graph
- **Media** — Garage-backed S3 uploads and entity attachments
- **App shell** — resizable nav, breadcrumbs, theme/transition settings, Keel Persona loading animations

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 18, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS, Framer Motion, React Flow, Three.js |
| Backend | FastAPI, Python 3.12, asyncpg, Pydantic, Celery |
| Data | PostgreSQL 16 (pgvector), Redis, Garage (S3-compatible) |
| AI | OpenAI / Anthropic / Moonshot providers, Tavily web search |
| Infra | Docker Compose |

## Project structure

```
keel_showcase/
├── backend/          # FastAPI API
├── frontend/         # Vite + React web app
├── docs/             # Runbooks and module reference
└── docker-compose.yml
```

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Google Cloud OAuth credentials (for login)
- LLM API keys (for chat and agents)

## Configuration

Environment files live in each app directory:

| File | Purpose |
|------|---------|
| [`backend/.env`](backend/.env) | Database, OAuth, session, LLM keys, Garage S3 |
| [`frontend/.env`](frontend/.env) | `VITE_DEV_PORT`, `VITE_PREVIEW_PORT`, `VITE_API_BASE_URL` |

Secret values (`GOOGLE_CLIENT_*`, `SESSION_SECRET`, `OPENAI_API_KEY`, `S3_ACCESS_KEY`, etc.) are left empty in git. Fill them on your server or local machine — **never commit populated secrets**.

For local development, point `VITE_API_BASE_URL` at `http://127.0.0.1:9092` and update OAuth redirect URIs accordingly.

## Quick start

### Backend

From the repo root:

```bash
docker compose --env-file backend/.env up --build -d
```

API: `http://127.0.0.1:9092`  
Health: `http://127.0.0.1:9092/health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dev server: `http://127.0.0.1:5173`

### Production preview

```bash
cd frontend
npm run build
npm run preview
```

Preview server: `http://127.0.0.1:5177` (matches Hetzner + Caddy setup)

## Documentation

- [Starting and stopping services](docs/STARTUP.md) — Hetzner deployment runbook
- [Included modules](docs/MODULES.md) — feature module reference

## License

MIT — see [LICENSE](LICENSE).
