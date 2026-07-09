# stack_sandbox/backend/src/llm/prompts/registry.py
"""Compose system prompts from DB-backed sections plus shared runtime blocks."""

from __future__ import annotations

from core.errors import AppError
from llm.agents.registry import get_agent, get_delegatable_agents
from llm.catalog.cache import (
    SystemPromptSection,
    assemble_system_prompt_base,
    get_catalog_cache,
    sections_from_prompt_entry,
)
from llm.prompts.common import COMMON_SYSTEM_PROMPT


def _render_subagent_catalog() -> str:
    """Format delegatable sub-agents for the Keel system prompt."""
    agents = get_delegatable_agents("keel")
    if not agents:
        body = "- (none)"
    else:
        body = "\n".join(f"- {agent.id}: {agent.description}" for agent in agents)
    return f"Available sub-agents:\n{body}"


RULES_PRECEDENCE_LINE = (
    "If anything above conflicts with the user rules below, always follow the user rules."
)


def merge_rules_to_prompt(core: str, rules_block: str = "") -> str:
    """Append user rules with precedence guidance when present."""
    extra = rules_block.strip()
    if not extra:
        return core
    return f"{core}\n\n{RULES_PRECEDENCE_LINE}\n\n{extra}"


def merge_rule_entries_to_block(
    rules: list[tuple[str, str]],
) -> str:
    """Render titled rule entries into one markdown block."""
    parts: list[str] = []
    for title, content in rules:
        trimmed_title = title.strip()
        trimmed_content = content.strip()
        if not trimmed_content:
            continue
        if trimmed_title:
            parts.append(f"**{trimmed_title}:**\n{trimmed_content}")
        else:
            parts.append(trimmed_content)
    return "\n\n".join(parts)


def get_system_prompt_sections(
    agent_id: str,
    *,
    rules_block: str = "",
) -> list[SystemPromptSection]:
    """Return ordered prompt sections for UI display (DB columns + runtime blocks)."""
    get_agent(agent_id)
    cache = get_catalog_cache()
    cache.require_loaded()
    agent = cache.agents[agent_id]
    prompt_entry = cache.system_prompts.get(agent.system_prompt_key)
    if prompt_entry is None:
        raise AppError(
            f"No system prompt registered for key {agent.system_prompt_key!r}",
            status_code=500,
        )

    sections = sections_from_prompt_entry(prompt_entry)

    if agent_id == "keel":
        sections.append(
            SystemPromptSection(
                key="available_sub_agents",
                label="Available sub-agents",
                content=_render_subagent_catalog().removeprefix("Available sub-agents:\n"),
            )
        )

    sections.append(
        SystemPromptSection(
            key="shared_output_format",
            label="Shared output format",
            content=COMMON_SYSTEM_PROMPT.strip(),
        )
    )

    rules = rules_block.strip()
    if rules:
        sections.append(
            SystemPromptSection(
                key="user_rules",
                label="User rules",
                content=f"{RULES_PRECEDENCE_LINE}\n\n{rules}",
            )
        )

    return sections


def get_system_prompt(
    agent_id: str,
    *,
    user_context: dict | None = None,
    rules_block: str = "",
    extra_context_block: str = "",
) -> str:
    """Build the full runtime system prompt for an agent."""
    get_agent(agent_id)
    cache = get_catalog_cache()
    cache.require_loaded()
    agent = cache.agents[agent_id]
    base = assemble_system_prompt_base(agent.system_prompt_key)

    if agent_id == "keel":
        prompt = f"{base}\n\n{_render_subagent_catalog()}"
    else:
        prompt = base

    prompt = f"{prompt}\n\n{COMMON_SYSTEM_PROMPT}"

    if user_context:
        context_lines = "\n".join(f"- {key}: {value}" for key, value in user_context.items())
        prompt = f"{prompt}\n\nUser context:\n{context_lines}\n"

    extra = extra_context_block.strip()
    if extra:
        prompt = f"{prompt}\n\n{extra}\n"

    return merge_rules_to_prompt(prompt, rules_block)


def list_prompt_keys() -> list[str]:
    """Return sorted registered system prompt keys."""
    cache = get_catalog_cache()
    cache.require_loaded()
    return sorted(cache.system_prompts.keys())
