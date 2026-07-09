# keel_api/src/main.py
"""FastAPI application entrypoint for the Keel API."""

import logging
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app_modules.registry import MODULE_REGISTRY
from core.cors import cors_origins
from core.database import close_pool, init_pool
from core.errors import register_exception_handlers
from core.logging import setup_logging
from llm.catalog import load_catalog_cache

logger = logging.getLogger(__name__)


def _cors_origins() -> list[str]:
    return cors_origins()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Initialize logging, DB pool, and catalog cache on startup; close pool on shutdown."""
    setup_logging()
    await init_pool()
    await load_catalog_cache()
    logger.info("Keel API started (database pool + catalog cache ready)")
    yield
    await close_pool()
    logger.info("Keel API shutdown complete")


app = FastAPI(
    title="Keel API",
    description="Production API for Keel — personal assistant backend.",
    version="1.0.0",
    lifespan=lifespan,
)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for registration in MODULE_REGISTRY:
    if registration.enabled():
        app.include_router(registration.router)


# GET /health — unauthenticated liveness check (no auth, no DB)
@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


# GET /test — unauthenticated dev/stress-test endpoint (no auth, no DB)
@app.get("/test")
async def test_route() -> str:
    return secrets.token_urlsafe(16)
