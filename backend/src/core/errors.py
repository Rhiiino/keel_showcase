# stack_sandbox/backend/src/core/errors.py
"""Application errors and FastAPI exception handlers."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from core.cors import cors_headers_for_request


class AppError(Exception):
    """Raised by services; mapped to an HTTP response by the registered handler."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        """Attach HTTP status code and message for the exception handler."""
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def _app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Serialize AppError instances as JSON API responses."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
        headers=cors_headers_for_request(request),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register AppError handling on the FastAPI application."""
    app.add_exception_handler(AppError, _app_error_handler)
