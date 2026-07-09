# stack_sandbox/backend/src/llm/tools/native/projects/_projects.py

"""Shared helpers for project tool executors."""

from __future__ import annotations

from typing import Any

from core.errors import AppError
from pydantic import BaseModel
from llm.tools.contracts import ToolContext


def dump_model(model: BaseModel) -> dict[str, Any]:
    """Serialize a project Pydantic model to a JSON-compatible dict."""
    return model.model_dump(mode="json")


def dump_models(models: list[BaseModel]) -> list[dict[str, Any]]:
    """Serialize a list of project Pydantic models to dicts."""
    return [dump_model(m) for m in models]


def resolve_project_id(arguments: dict[str, Any], context: ToolContext) -> int:
    """Resolve project_id from tool args or active workspace context."""
    project_id = arguments.get("project_id")
    if isinstance(project_id, int) and project_id >= 1:
        return project_id
    if context.project_id is not None and context.project_id >= 1:
        return context.project_id
    raise AppError("project_id must be a positive integer.", status_code=400)


async def resolve_canvas_id(
    arguments: dict[str, Any],
    context: ToolContext,
    *,
    user_id: int,
    project_id: int,
) -> int:
    """Resolve canvas_id from tool args or the project's default canvas."""
    from core.database import get_pool
    from modules.projects.service import canvases_service

    canvas_id = arguments.get("canvas_id")
    if isinstance(canvas_id, int) and canvas_id >= 1:
        return canvas_id

    pool = get_pool()
    async with pool.acquire() as conn:
        return await canvases_service.resolve_default_canvas_id(
            conn,
            user_id=user_id,
            project_id=project_id,
        )
