# keel_api/src/modules/jobs/runtime.py
"""Stable async bridge entrypoint for Celery task authors."""

from modules.jobs.worker.runtime import run_async  # noqa: F401
