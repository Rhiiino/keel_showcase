# Backend

FastAPI backend for **Keel Showcase**.

## Stack

- FastAPI + Uvicorn
- PostgreSQL 16 with pgvector
- Redis + Celery (background jobs)
- Garage (S3-compatible media storage)

## Environment

All configuration is in [`backend/.env`](.env). See the root [README](../README.md) for variable descriptions.

The API listens on port **9092** by default (host bind). Inside Docker, the container serves on port 8000.

## Local development

From the **repo root** (not this directory):

```bash
docker compose --env-file backend/.env up --build
```

Health check: `http://127.0.0.1:9092/health`

## Module architecture

Feature modules live under `src/modules/`. Each module owns its router, service layer, and schemas. Registration is centralized in `src/app_modules/registry.py`.

See [docs/MODULES.md](../docs/MODULES.md) for the showcase module list.
