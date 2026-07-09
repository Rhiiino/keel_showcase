# keel_api/src/modules/jobs/celery_app.py
"""Stable Celery app entrypoint for Docker and task authors."""

from modules.jobs.worker.app import celery_app  # noqa: F401
