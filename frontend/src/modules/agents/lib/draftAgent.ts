// stack_sandbox/frontend_web/src/modules/agents/lib/draftAgent.ts

// Client-side draft sub-agent scaffolded from the Agents page + button.

import type { AgentSummary } from "../api";

export const DRAFT_AGENT_ID = "__draft_subagent__";

export function isDraftAgent(agent: AgentSummary | null | undefined): boolean {
  return agent?.id === DRAFT_AGENT_ID;
}

export function createDraftAgentSummary(): AgentSummary {
  return {
    id: DRAFT_AGENT_ID,
    display_name: "New sub-agent",
    description: "",
    system_prompt_key: "",
    tool_categories: ["core"],
    tools: [],
    is_orchestrator: false,
    delegates_to: [],
    media: [],
  };
}
