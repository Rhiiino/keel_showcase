# keel_api/src/modules/jobs/service/tasks.py
"""Read-only catalog of registered Celery tasks."""

from __future__ import annotations

from modules.jobs import config as jobs_config
from modules.jobs.schemas import JobTaskKwargSpec, JobTaskPublic
from modules.jobs.service._helpers import task_label
from modules.jobs.worker.registry import TASK_REGISTRY



# ----- Registered tasks
async def list_registered_tasks() -> list[JobTaskPublic]:
    """Return metadata for every task in the worker registry."""
    tasks: list[JobTaskPublic] = []
    for task_name in TASK_REGISTRY:
        entry = jobs_config.TASK_CATALOG.get(task_name)
        kwargs = [
            JobTaskKwargSpec(
                name=spec.name,
                type=spec.type,
                default=spec.default,
                description=spec.description,
            )
            for spec in (entry.kwargs if entry is not None else ())
        ]
        tasks.append(
            JobTaskPublic(
                task_name=task_name,
                label=task_label(task_name),
                description=entry.description if entry is not None else "",
                queue=entry.queue if entry is not None else jobs_config.DEFAULT_QUEUE,
                schedulable=task_name in jobs_config.SCHEDULABLE_TASKS,
                kwargs=kwargs,
            )
        )
    return sorted(tasks, key=lambda task: task.label.lower())
