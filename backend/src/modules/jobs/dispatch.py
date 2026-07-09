# keel_api/src/modules/jobs/dispatch.py
"""Stable enqueue entrypoint for feature modules and HTTP service."""

from modules.jobs.worker.dispatch import enqueue  # noqa: F401
