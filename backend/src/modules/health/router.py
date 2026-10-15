# backend/src/modules/health/router.py
"""Unauthenticated liveness route. Monitors expect HTTP 200 from GET /health."""

from fastapi import APIRouter

from modules.health.schemas import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """Report that the API process is serving requests."""
    return HealthResponse(status="ok", service="keel-showcase-api")
