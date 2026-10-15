# backend/src/modules/health/schemas.py
"""Response model for the showcase API health check."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
