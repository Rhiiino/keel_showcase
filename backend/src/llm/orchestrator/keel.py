# stack_sandbox/backend/src/llm/orchestrator/keel.py
"""Keel orchestrator: stream a turn, delegate to a sub-agent on demand, run tools.

Entry point for every chat turn. Keel handles the turn directly and may hand off
to a sub-agent by calling the virtual `delegate` tool, at which point the active
agent (prompt + tools) is swapped and streaming continues as the sub-agent. It
performs no persistence (the chat service owns the database) and no HTTP. The
terminal `COMPLETED` event hands the buffered assistant content, token usage, and
executed tool calls back to the service for a single transactional write.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any, AsyncIterator

from core.config import get_settings
from core.errors import AppError
from llm.agents.contracts import AgentDefinition
from llm.agents.registry import get_agent, get_orchestrator
from llm.orchestrator.delegation import parse_delegate_call
from llm.tools.manifest import build_tool_manifest_for_agent
from llm.orchestrator.events import EventName, OrchestratorEvent
from llm.prompts.registry import get_system_prompt
from llm.providers.base import ChatTurn, LLMStreamProvider, StreamDelta, StreamDone
from llm.providers.factory import get_active_model, get_chat_provider
from llm.tools.assignments import is_tool_allowed_for_agent
from llm.tools.contracts import ToolContext
from llm.tools.registry import TOOL_CATEGORY_MAP, TOOL_EXECUTORS

logger = logging.getLogger(__name__)


def _apply_llm_for_agent(
    agent_id: str,
    llm_by_agent: dict[str, tuple[str, str]],
) -> tuple[LLMStreamProvider, str]:
    """Resolve provider instance and model id for the active agent."""
    provider_name, model_id = llm_by_agent[agent_id]
    return (
        get_chat_provider(provider_name=provider_name, model=model_id),
        get_active_model(provider_name=provider_name, model=model_id),
    )


def _build_manifest(agent: AgentDefinition) -> list[dict[str, Any]] | None:
    """Tools for an agent, plus the virtual `delegate` tool for orchestrators."""
    tools = build_tool_manifest_for_agent(agent.id)
    return tools or None


async def handle_turn(
    *,
    history: list[ChatTurn],
    user_id: int,
    user_context: dict[str, Any] | None = None,
    llm_by_agent: dict[str, tuple[str, str]],
    rules_by_agent: dict[str, str] | None = None,
    force_agent_id: str | None = None,
    extra_context_block: str = "",
    tool_project_id: int | None = None,
    conversation_id: int | None = None,
) -> AsyncIterator[OrchestratorEvent]:
    """Drive one assistant turn end to end as a stream of events.

    `history` already includes the just-saved user message (oldest first).
    `llm_by_agent` maps each registered agent id to (provider_name, model_id).
    When `force_agent_id` is set, skip the orchestrator and start on that agent.
    """
    settings = get_settings()
    tool_context = ToolContext(
        user_id=user_id,
        project_id=tool_project_id,
        conversation_id=conversation_id,
    )

    # Start on Keel or a forced sub-agent; emit agent_selected
    if force_agent_id is not None:
        agent = get_agent(force_agent_id)
    else:
        agent = get_orchestrator()
    provider, model = _apply_llm_for_agent(agent.id, llm_by_agent)
    agents_used: list[str] = [agent.id]
    yield OrchestratorEvent(
        EventName.AGENT_SELECTED,
        {"agent_id": agent.id, "delegated": force_agent_id is not None},
    )

    working_history = list(history)
    content_buffer = ""
    executed_tool_calls: list[dict[str, Any]] = []
    finish_reason = "stop"
    usage: dict[str, Any] | None = None
    call_order = 0

    # 4. Stream + tool/delegate loop
    for _iteration in range(max(1, settings.chat_max_tool_iterations)):
        # 3. Build system prompt + tools (incl. delegate) for active agent
        system_prompt = get_system_prompt(
            agent.id,
            user_context=user_context,
            rules_block=(rules_by_agent or {}).get(agent.id, ""),
            extra_context_block=extra_context_block,
        )
        tools = _build_manifest(agent)

        pending_tool_calls: list[dict[str, Any]] = []
        async for event in provider.stream(
            model=model,
            system_prompt=system_prompt,
            history=working_history,
            tools=tools,
        ):
            if isinstance(event, StreamDelta):
                if event.content:
                    content_buffer += event.content
                    yield OrchestratorEvent(EventName.DELTA, {"content": event.content})
            elif isinstance(event, StreamDone):
                finish_reason = event.finish_reason
                usage = event.usage or usage
                pending_tool_calls = event.tool_calls

        # Delegation takes precedence: switch active agent and re-stream as the sub-agent.
        target_id = parse_delegate_call(pending_tool_calls)
        if target_id is not None:
            agent = get_agent(target_id)
            if agent.id not in agents_used:
                agents_used.append(agent.id)
            yield OrchestratorEvent(
                EventName.AGENT_SELECTED, {"agent_id": agent.id, "delegated": True}
            )
            content_buffer = ""  # only the specialist's output is persisted
            finish_reason = "stop"
            provider, model = _apply_llm_for_agent(agent.id, llm_by_agent)
            continue

        if not pending_tool_calls:
            break

        # Execute each requested tool, emitting start/result events as we go.
        tool_result_lines: list[str] = []
        for tool_call in pending_tool_calls:
            function = tool_call.get("function") or {}
            tool_name = function.get("name") or ""
            category = TOOL_CATEGORY_MAP.get(tool_name)

            yield OrchestratorEvent(
                EventName.TOOL_CALL_START,
                {"tool_name": tool_name, "category": category, "call_order": call_order},
            )

            arguments_raw = function.get("arguments") or "{}"
            try:
                arguments = json.loads(arguments_raw)
            except json.JSONDecodeError:
                arguments = {}

            started_at = time.monotonic()
            success = True
            result: dict[str, Any]
            if not is_tool_allowed_for_agent(agent.id, tool_name):
                success = False
                result = {"error": f"Tool {tool_name!r} is not available to this agent."}
            else:
                try:
                    result = await TOOL_EXECUTORS[tool_name](arguments, tool_context)
                except AppError as exc:
                    logger.warning("Tool %s failed: %s", tool_name, exc.message)
                    success = False
                    result = {"error": exc.message}
                except Exception as exc:  # unexpected failures must not kill the stream
                    logger.exception("Tool %s failed", tool_name)
                    success = False
                    result = {"error": str(exc)}
            duration_seconds = time.monotonic() - started_at

            yield OrchestratorEvent(
                EventName.TOOL_CALL_RESULT,
                {
                    "tool_name": tool_name,
                    "category": category,
                    "success": success,
                    "summary": _summarize_result(result),
                    "duration_seconds": duration_seconds,
                },
            )

            executed_tool_calls.append(
                {
                    "tool_name": tool_name,
                    "category": category,
                    "tool_call_json": {"name": tool_name, "arguments": arguments},
                    "tool_response_json": result,
                    "duration_seconds": duration_seconds,
                    "call_order": call_order,
                }
            )
            tool_result_lines.append(f"{tool_name}: {json.dumps(result, default=str)}")
            call_order += 1

        # Feed results back so the model can incorporate them on the next round.
        # NOTE: scaffold uses a plain text turn; full tool_call_id threading is a
        # follow-up once multi-round tool use is needed.
        working_history = working_history + [
            ChatTurn(role="user", content="Tool results:\n" + "\n".join(tool_result_lines))
        ]

    # 5. Emit COMPLETED
    yield OrchestratorEvent(
        EventName.COMPLETED,
        {
            "agent_id": agent.id,
            "agents_used": agents_used,
            "content": content_buffer,
            "provider": provider.name,
            "model": model,
            "finish_reason": finish_reason,
            "usage": usage,
            "tool_calls": executed_tool_calls,
        },
    )


def _summarize_result(result: dict[str, Any]) -> str:
    """Short, client-safe summary of a tool result for the SSE event."""
    text = json.dumps(result, default=str)
    return text if len(text) <= 200 else text[:197] + "..."
