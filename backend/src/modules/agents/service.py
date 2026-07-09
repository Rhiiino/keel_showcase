# stack_sandbox/backend/src/modules/subagents/service.py
"""Subagent catalog, system-prompt preview, and catalog admin writes."""

from __future__ import annotations

import json
import re

from fastapi import UploadFile

from core.database import get_pool
from core.errors import AppError
from llm.agents.contracts import AgentDefinition
from llm.catalog import reload_catalog_cache
from llm.catalog.cache import get_catalog_cache
from llm.catalog.storage import write_catalog_upload
from modules.catalog import config as catalog_config
from modules.catalog import repository as catalog_repository
from modules.agents.schemas import AgentMediaPublic
from llm.agents.llm_prefs import (
    ResolvedLlm,
    delete_agent_llm_preferences,
    get_effective_agent_llm_preferences,
    upsert_agent_llm_preferences,
)
from llm.agents.registry import get_agent, list_agents
from llm.prompts.registry import get_system_prompt, get_system_prompt_sections
from llm.tokenization.estimate import count_context_usage, count_tool_token_breakdown
from llm.tools.assignments import get_tool_categories_for_agent
from llm.tools.manifest import build_tool_manifest_for_agent
from llm.tools.registry import TOOL_DEFINITIONS
from modules.chat import service as chat_service
from modules.chat.service import resolve_user_llm
from modules.media import config as media_config
from modules.media.validation import extension_for_upload, validate_image_upload
from modules.agents.schemas import (
    AgentContextUsageResponse,
    AgentCreate,
    AgentLlmPreferencesPublic,
    AgentLlmPreferencesUpdate,
    AgentSummary,
    AgentSystemPromptResponse,
    AgentSystemPromptUpdate,
    AgentUpdate,
    SystemPromptSectionPublic,
    ToolSummary,
    ToolTokenUsage,
)

ORCHESTRATOR_AGENT_KEY = "keel"
MAX_AGENT_KEY_LENGTH = 64

EDITABLE_PROMPT_SECTION_KEYS = frozenset({
    "identity",
    "purpose",
    "guidelines",
    "domain_reference",
    "tool_guidance",
    "safety",
})

REQUIRED_PROMPT_SECTION_KEYS = frozenset({
    "identity",
    "purpose",
    "guidelines",
    "domain_reference",
    "safety",
})


def _slugify_display_name(display_name: str) -> str:
    """Convert a display name into a stable agent key slug."""
    slug = display_name.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "_", slug)
    slug = slug.strip("_")
    if not slug:
        raise AppError(
            "Display name must contain at least one letter or number.",
            status_code=400,
        )
    return slug[:MAX_AGENT_KEY_LENGTH]


async def _resolve_unique_agent_key(conn, base_key: str) -> str:
    """Return a unique agent key, appending numeric suffixes on collision."""
    candidate = base_key
    suffix = 2
    while await catalog_repository.agent_key_exists(conn, candidate):
        trimmed_base = base_key[: max(1, MAX_AGENT_KEY_LENGTH - len(str(suffix)) - 1)]
        candidate = f"{trimmed_base}_{suffix}"
        suffix += 1
    return candidate


def _validate_tool_categories(category_keys: list[str]) -> None:
    """Ensure tool category keys exist in the loaded catalog."""
    if not category_keys:
        raise AppError("At least one tool category is required.", status_code=400)
    cache = get_catalog_cache()
    cache.require_loaded()
    unknown = sorted(set(category_keys) - set(cache.tool_categories.keys()))
    if unknown:
        raise AppError(
            f"Unknown tool categories: {', '.join(unknown)}",
            status_code=400,
        )


def _validate_system_prompt_create(payload: AgentCreate) -> dict[str, str]:
    """Validate and normalize system prompt sections for agent creation."""
    prompt = payload.system_prompt
    sections = {
        "identity": prompt.identity.strip(),
        "purpose": prompt.purpose.strip(),
        "guidelines": prompt.guidelines.strip(),
        "domain_reference": prompt.domain_reference.strip(),
        "safety": prompt.safety.strip(),
    }
    tool_guidance = (prompt.tool_guidance or "").strip()
    for key, content in sections.items():
        if not content:
            raise AppError(
                f"System prompt section {key!r} cannot be empty.",
                status_code=400,
            )
    sections["tool_guidance"] = tool_guidance or None
    return sections


async def _read_upload_file(upload: UploadFile) -> tuple[str, str, bytes]:
    """Read an upload file and return filename, content type, and bytes."""
    data = await upload.read()
    filename = upload.filename or "upload"
    content_type = upload.content_type or "application/octet-stream"
    return filename, content_type, data


def _validate_tile_image(filename: str, content_type: str, data: bytes) -> tuple[str, str]:
    """Validate portrait upload and return MIME type plus storage key suffix."""
    validate_image_upload(content_type, filename, data)
    extension = extension_for_upload(content_type, filename)
    if extension not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
        raise AppError("Portrait image must be PNG, JPEG, WebP, or GIF.", status_code=400)
    if extension == ".jpeg":
        extension = ".jpg"
    return content_type, extension


def _validate_model_3d(filename: str, content_type: str, data: bytes) -> None:
    """Validate optional GLB turntable upload."""
    if not data:
        raise AppError("3D model file is empty.", status_code=400)
    if len(data) > media_config.MAX_MEDIA_BYTES:
        raise AppError("3D model exceeds maximum upload size.", status_code=400)
    suffix = filename.lower().rsplit(".", maxsplit=1)[-1] if "." in filename else ""
    if suffix != "glb" and content_type != "model/gltf-binary":
        raise AppError("3D model must be a GLB file.", status_code=400)


async def create_agent_for_user(
    payload: AgentCreate,
    *,
    tile_image: UploadFile,
    model_3d: UploadFile | None = None,
) -> AgentSummary:
    """Create a sub-agent with prompt, tool grants, Keel delegation, and media."""
    _validate_tool_categories(payload.tool_categories)
    prompt_sections = _validate_system_prompt_create(payload)

    tile_filename, tile_content_type, tile_data = await _read_upload_file(tile_image)
    tile_mime, tile_extension = _validate_tile_image(
        tile_filename,
        tile_content_type,
        tile_data,
    )

    model_data: bytes | None = None
    model_mime = "model/gltf-binary"
    if model_3d is not None:
        model_filename, model_content_type, model_data = await _read_upload_file(model_3d)
        if model_data:
            _validate_model_3d(model_filename, model_content_type, model_data)
            if model_content_type:
                model_mime = model_content_type

    base_key = _slugify_display_name(payload.display_name)
    pool = get_pool()
    agent_key: str | None = None

    async with pool.acquire() as conn:
        async with conn.transaction():
            agent_key = await _resolve_unique_agent_key(conn, base_key)

            prompt_row = await catalog_repository.insert_system_prompt(
                conn,
                key=agent_key,
                display_name=payload.display_name.strip(),
                identity=prompt_sections["identity"],
                purpose=prompt_sections["purpose"],
                guidelines=prompt_sections["guidelines"],
                domain_reference=prompt_sections["domain_reference"],
                tool_guidance=prompt_sections["tool_guidance"],
                safety=prompt_sections["safety"],
            )
            sort_order = await catalog_repository.fetch_next_subagent_sort_order(conn)
            agent_row = await catalog_repository.insert_agent(
                conn,
                key=agent_key,
                display_name=payload.display_name.strip(),
                description=payload.description.strip(),
                system_prompt_id=prompt_row["id"],
                sort_order=sort_order,
            )

            await catalog_repository.replace_agent_tool_categories(
                conn,
                agent_key=agent_key,
                category_keys=payload.tool_categories,
            )

            orchestrator_row = await catalog_repository.fetch_agent_row_by_key(
                conn,
                ORCHESTRATOR_AGENT_KEY,
            )
            if orchestrator_row is None:
                raise AppError("Orchestrator agent is not registered.", status_code=500)

            await catalog_repository.insert_agent_delegation(
                conn,
                parent_agent_id=orchestrator_row["id"],
                child_agent_id=agent_row["id"],
            )

            tile_storage_key = f"agents/{agent_key}/image{tile_extension}"
            write_catalog_upload(tile_storage_key, tile_data)
            await catalog_repository.insert_catalog_media(
                conn,
                agent_id=agent_row["id"],
                media_kind="image",
                role="tile",
                storage_key=tile_storage_key,
                mime_type=tile_mime,
            )

            if model_data:
                model_storage_key = f"agents/{agent_key}/model.glb"
                write_catalog_upload(model_storage_key, model_data)
                await catalog_repository.insert_catalog_media(
                    conn,
                    agent_id=agent_row["id"],
                    media_kind="model_3d",
                    role="turntable",
                    storage_key=model_storage_key,
                    mime_type=model_mime,
                )

    await reload_catalog_cache()
    return _agent_summary_for_id(agent_key)


async def update_agent_media_for_user(
    agent_id: str,
    *,
    tile_image: UploadFile | None = None,
    model_3d: UploadFile | None = None,
) -> AgentSummary:
    """Replace portrait and/or turntable media for a sub-agent."""
    agent = get_agent(agent_id)
    if agent.is_orchestrator:
        raise AppError("Orchestrator media cannot be changed.", status_code=400)
    if tile_image is None and model_3d is None:
        return _agent_summary_for_id(agent_id)

    tile_payload: tuple[str, bytes, str] | None = None
    model_payload: tuple[str, bytes] | None = None

    if tile_image is not None:
        tile_filename, tile_content_type, tile_data = await _read_upload_file(tile_image)
        tile_mime, tile_extension = _validate_tile_image(
            tile_filename,
            tile_content_type,
            tile_data,
        )
        tile_payload = (tile_mime, tile_data, tile_extension)

    if model_3d is not None:
        model_filename, model_content_type, model_data = await _read_upload_file(model_3d)
        if model_data:
            _validate_model_3d(model_filename, model_content_type, model_data)
            model_payload = (model_content_type or "model/gltf-binary", model_data)

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            agent_row = await catalog_repository.fetch_agent_row_by_key(conn, agent.id)
            if agent_row is None:
                raise AppError(f"Agent {agent_id!r} not found.", status_code=404)
            agent_db_id = agent_row["id"]

            if tile_payload is not None:
                tile_mime, tile_data, tile_extension = tile_payload
                tile_storage_key = f"agents/{agent.id}/image{tile_extension}"
                write_catalog_upload(tile_storage_key, tile_data)
                await catalog_repository.replace_agent_catalog_media(
                    conn,
                    agent_id=agent_db_id,
                    media_kind="image",
                    role="tile",
                    storage_key=tile_storage_key,
                    mime_type=tile_mime,
                )

            if model_payload is not None:
                model_mime, model_data = model_payload
                model_storage_key = f"agents/{agent.id}/model.glb"
                write_catalog_upload(model_storage_key, model_data)
                await catalog_repository.replace_agent_catalog_media(
                    conn,
                    agent_id=agent_db_id,
                    media_kind="model_3d",
                    role="turntable",
                    storage_key=model_storage_key,
                    mime_type=model_mime,
                )

    await reload_catalog_cache()
    return _agent_summary_for_id(agent_id)


def parse_agent_create_payload(raw_payload: str) -> AgentCreate:
    """Parse and validate JSON payload from multipart create form."""
    try:
        parsed = json.loads(raw_payload)
    except json.JSONDecodeError as exc:
        raise AppError("Invalid agent payload JSON.", status_code=400) from exc
    if not isinstance(parsed, dict):
        raise AppError("Agent payload must be a JSON object.", status_code=400)
    return AgentCreate.model_validate(parsed)


def _media_for_agent(agent_id: str) -> list[AgentMediaPublic]:
    """Return catalog media URLs for an agent."""
    cache = get_catalog_cache()
    cache.require_loaded()
    prefix = catalog_config.ROUTE_PREFIX + catalog_config.MEDIA_PATH
    return [
        AgentMediaPublic(
            media_kind=item.media_kind,
            role=item.role,
            mime_type=item.mime_type,
            url=f"{prefix}/{item.storage_key}",
            updated_at=item.updated_at.isoformat() if item.updated_at else None,
        )
        for item in cache.catalog_media
        if item.agent_key == agent_id
    ]


def _tool_summaries_for_agent(agent_id: str) -> list[ToolSummary]:
    """Return sorted tool metadata for an agent's assigned categories."""
    allowed = get_tool_categories_for_agent(agent_id)
    summaries = [
        ToolSummary(
            name=definition.name,
            category=definition.category,
            description=definition.description.split("\n", maxsplit=1)[0].strip(),
        )
        for definition in TOOL_DEFINITIONS.values()
        if definition.category in allowed
    ]
    return sorted(summaries, key=lambda tool: (tool.category, tool.name))


def _agent_summary_for_id(agent_id: str) -> AgentSummary:
    """Return one agent summary from the loaded registry."""
    agent = get_agent(agent_id)
    return AgentSummary(
        id=agent.id,
        display_name=agent.display_name,
        description=agent.description,
        system_prompt_key=agent.system_prompt_key,
        tool_categories=sorted(agent.tool_categories),
        tools=_tool_summaries_for_agent(agent.id),
        is_orchestrator=agent.is_orchestrator,
        delegates_to=sorted(agent.delegates_to),
        media=_media_for_agent(agent.id),
    )


def list_agent_summaries() -> list[AgentSummary]:
    """Return metadata for every registered agent."""

    def sort_key(agent: AgentDefinition) -> tuple[int, str]:
        """Sort orchestrators first, then by display name."""
        return (0 if agent.is_orchestrator else 1, agent.display_name.lower())

    sorted_agents = sorted(list_agents(), key=sort_key)

    return [
        AgentSummary(
            id=agent.id,
            display_name=agent.display_name,
            description=agent.description,
            system_prompt_key=agent.system_prompt_key,
            tool_categories=sorted(agent.tool_categories),
            tools=_tool_summaries_for_agent(agent.id),
            is_orchestrator=agent.is_orchestrator,
            delegates_to=sorted(agent.delegates_to),
            media=_media_for_agent(agent.id),
        )
        for agent in sorted_agents
    ]


def _to_preferences_public(agent_id: str, resolved: ResolvedLlm) -> AgentLlmPreferencesPublic:
    """Map resolved LLM prefs to the public API model."""
    return AgentLlmPreferencesPublic(
        agent_id=agent_id,
        provider=resolved.provider,
        model_id=resolved.model_id,
        max_context_window=resolved.max_context_window,
        has_override=resolved.has_override,
    )


async def get_agent_llm_preferences_for_user(
    user_id: int,
    agent_id: str,
) -> AgentLlmPreferencesPublic:
    """Effective LLM provider/model for an agent (override or global chat default)."""
    get_agent(agent_id)
    global_prefs = await resolve_user_llm(user_id)
    resolved = await get_effective_agent_llm_preferences(
        user_id,
        agent_id,
        global_provider=global_prefs.provider,
        global_model_id=global_prefs.model_id,
    )
    return _to_preferences_public(agent_id, resolved)


async def update_agent_llm_preferences_for_user(
    user_id: int,
    agent_id: str,
    payload: AgentLlmPreferencesUpdate,
) -> AgentLlmPreferencesPublic:
    """Save per-sub-agent LLM provider/model override for a user."""
    resolved = await upsert_agent_llm_preferences(
        user_id,
        agent_id,
        provider=payload.provider,
        model_id=payload.model_id,
    )
    return _to_preferences_public(agent_id, resolved)


async def clear_agent_llm_preferences_for_user(
    user_id: int,
    agent_id: str,
) -> AgentLlmPreferencesPublic:
    """Clear per-sub-agent override so global chat preferences apply."""
    global_prefs = await resolve_user_llm(user_id)
    resolved = await delete_agent_llm_preferences(
        user_id,
        agent_id,
        global_provider=global_prefs.provider,
        global_model_id=global_prefs.model_id,
    )
    return _to_preferences_public(agent_id, resolved)


async def get_agent_system_prompt_for_user(
    user_id: int,
    agent_id: str,
) -> AgentSystemPromptResponse:
    """Return the composed system prompt including the user's active chat rules."""
    agent = get_agent(agent_id)
    rules_block = await chat_service.get_rules_block_for_agent(user_id, agent_id)
    sections = get_system_prompt_sections(agent.id, rules_block=rules_block)
    return AgentSystemPromptResponse(
        agent_id=agent.id,
        system_prompt=get_system_prompt(agent.id, rules_block=rules_block),
        sections=[
            SystemPromptSectionPublic(
                key=section.key,
                label=section.label,
                content=section.content,
                editable=section.key in EDITABLE_PROMPT_SECTION_KEYS,
            )
            for section in sections
        ],
    )


async def update_agent_for_user(
    agent_id: str,
    payload: AgentUpdate,
) -> AgentSummary:
    """Update agent metadata and/or tool category grants, then reload the catalog cache."""
    agent = get_agent(agent_id)
    if agent.is_orchestrator:
        raise AppError("Orchestrator agent cannot be edited.", status_code=400)
    has_metadata = payload.display_name is not None or payload.description is not None
    has_categories = payload.tool_categories is not None

    if not has_metadata and not has_categories:
        return _agent_summary_for_id(agent_id)

    if has_categories:
        categories = payload.tool_categories or []
        if not categories:
            raise AppError("At least one tool category is required.", status_code=400)
        cache = get_catalog_cache()
        cache.require_loaded()
        unknown = sorted(set(categories) - set(cache.tool_categories.keys()))
        if unknown:
            raise AppError(
                f"Unknown tool categories: {', '.join(unknown)}",
                status_code=400,
            )

    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            if has_metadata:
                row = await catalog_repository.update_agent_metadata(
                    conn,
                    agent_key=agent.id,
                    display_name=payload.display_name,
                    description=payload.description,
                )
                if row is None:
                    raise AppError(f"Agent {agent_id!r} not found.", status_code=404)

            if has_categories:
                await catalog_repository.replace_agent_tool_categories(
                    conn,
                    agent_key=agent.id,
                    category_keys=list(payload.tool_categories or []),
                )

    await reload_catalog_cache()
    return _agent_summary_for_id(agent_id)


async def update_agent_system_prompt_for_user(
    user_id: int,
    agent_id: str,
    payload: AgentSystemPromptUpdate,
) -> AgentSystemPromptResponse:
    """Update DB-backed system prompt sections for an agent, then reload the catalog cache."""
    agent = get_agent(agent_id)
    if agent.is_orchestrator:
        raise AppError("Orchestrator system prompt cannot be edited.", status_code=400)
    if not payload.sections:
        return await get_agent_system_prompt_for_user(user_id, agent_id)

    section_updates: dict[str, str] = {}
    for section in payload.sections:
        if section.key not in EDITABLE_PROMPT_SECTION_KEYS:
            raise AppError(
                f"System prompt section {section.key!r} is not editable.",
                status_code=400,
            )
        content = section.content.strip()
        if section.key in REQUIRED_PROMPT_SECTION_KEYS and not content:
            raise AppError(
                f"System prompt section {section.key!r} cannot be empty.",
                status_code=400,
            )
        section_updates[section.key] = section.content

    pool = get_pool()
    async with pool.acquire() as conn:
        row = await catalog_repository.update_system_prompt_sections(
            conn,
            prompt_key=agent.system_prompt_key,
            identity=section_updates.get("identity"),
            purpose=section_updates.get("purpose"),
            guidelines=section_updates.get("guidelines"),
            domain_reference=section_updates.get("domain_reference"),
            tool_guidance=section_updates.get("tool_guidance"),
            safety=section_updates.get("safety"),
        )
        if row is None:
            raise AppError(
                f"No system prompt registered for key {agent.system_prompt_key!r}",
                status_code=404,
            )

    await reload_catalog_cache()
    return await get_agent_system_prompt_for_user(user_id, agent_id)


async def get_agent_context_usage_for_user(
    user_id: int,
    agent_id: str,
) -> AgentContextUsageResponse:
    """Estimate input tokens for an agent's system prompt and tool manifest."""
    agent = get_agent(agent_id)
    global_prefs = await resolve_user_llm(user_id)
    resolved = await get_effective_agent_llm_preferences(
        user_id,
        agent_id,
        global_provider=global_prefs.provider,
        global_model_id=global_prefs.model_id,
    )

    rules_block = await chat_service.get_rules_block_for_agent(user_id, agent_id)
    system_prompt = get_system_prompt(agent.id, rules_block=rules_block)
    tools = build_tool_manifest_for_agent(agent_id)

    system_tokens, tools_tokens, is_estimate = count_context_usage(
        system_prompt=system_prompt,
        tools=tools,
        provider=resolved.provider,
        model_id=resolved.model_id,
    )
    breakdown, breakdown_estimate = count_tool_token_breakdown(
        tools,
        resolved.provider,
        resolved.model_id,
    )

    return AgentContextUsageResponse(
        agent_id=agent.id,
        provider=resolved.provider,
        model_id=resolved.model_id,
        max_context_window=resolved.max_context_window,
        system_prompt_tokens=system_tokens,
        tools_tokens=tools_tokens,
        total_tokens=system_tokens + tools_tokens,
        tool_count=len(tools),
        tool_breakdown=[
            ToolTokenUsage(name=entry.name, category=entry.category, tokens=entry.tokens)
            for entry in breakdown
        ],
        is_estimate=is_estimate or breakdown_estimate,
    )
