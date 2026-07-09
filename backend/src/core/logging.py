# stack_sandbox/backend/src/core/logging.py
"""Stdlib logging setup (structlog deferred for post-MVP)."""

import logging

from core.config import get_settings


def setup_logging() -> None:
    """Configure stdlib logging from the configured log level."""
    settings = get_settings()
    level_name = settings.log_level.upper()
    level = getattr(logging, level_name, logging.INFO)

    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )
