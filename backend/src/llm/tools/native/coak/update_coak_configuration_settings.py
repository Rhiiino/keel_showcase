# keel_api/src/llm/tools/native/coak/update_coak_configuration_settings.py

from __future__ import annotations

from typing import Any

from core.errors import AppError
from llm.tools.categories import COAK
from llm.tools.contracts import ToolContext, ToolDefinition
from llm.tools.native.coak._coak import dump_model, require_record_id
from modules.coak.schemas import CoakConfigurationSettingsUpdate
from modules.coak.service import configuration_settings as configuration_settings_service


async def execute(arguments: dict[str, Any], context: ToolContext) -> dict[str, Any]:
    """Update visual and configuration settings for a Coak record."""
    record_id = require_record_id(arguments)
    settings = arguments.get("settings")
    if not isinstance(settings, dict):
        raise AppError("settings must be an object.", status_code=400)
    payload = CoakConfigurationSettingsUpdate(settings=settings)
    updated = await configuration_settings_service.update_configuration_settings(
        context.user_id,
        record_id,
        payload,
    )
    return {"configuration_settings": dump_model(updated)}


TOOL_DEFINITION = ToolDefinition(
    name="update_coak_configuration_settings",
    category=COAK,
    description=(
        "Update visual and configuration settings for a Coak record. "
        "Settings is a dict of keys such as node_visuals, node_size_scale, "
        "connection_color, constellation_background, and auto_optimize_layout."
    ),
    parameters={
        "type": "object",
        "properties": {
            "record_id": {"type": "integer"},
            "settings": {
                "type": "object",
                "description": "Configuration settings key-value map.",
                "additionalProperties": True,
            },
        },
        "required": ["record_id", "settings"],
        "additionalProperties": False,
    },
    returns="{ configuration_settings: object }",
    executor=execute,
)
