// stack_sandbox/frontend_web/src/modules/agents/api.ts

// Agents module API: subagent catalog and system-prompt preview.

import { apiFetch } from "../../lib/api";

export type AgentMedia = {
  media_kind: string;
  role: string | null;
  mime_type: string;
  url: string;
};

export type ToolSummary = {
  name: string;
  category: string;
  description: string;
};

export type AgentSummary = {
  id: string;
  display_name: string;
  description: string;
  system_prompt_key: string;
  tool_categories: string[];
  tools: ToolSummary[];
  is_orchestrator: boolean;
  delegates_to: string[];
  media: AgentMedia[];
};

export type SystemPromptSection = {
  key: string;
  label: string | null;
  content: string;
  editable?: boolean;
};

export type AgentSystemPrompt = {
  agent_id: string;
  system_prompt: string;
  sections: SystemPromptSection[];
};

export type AgentLlmPreferences = {
  agent_id: string;
  provider: string;
  model_id: string;
  max_context_window: number;
  has_override: boolean;
};

export type AgentLlmPreferencesUpdate = {
  provider: string;
  model_id: string;
};

export type AgentUpdate = {
  display_name?: string;
  description?: string;
  tool_categories?: string[];
};

export type SystemPromptSectionUpdate = {
  key: string;
  content: string;
};

export type AgentSystemPromptUpdate = {
  sections: SystemPromptSectionUpdate[];
};

export type ToolTokenUsage = {
  name: string;
  category: string;
  tokens: number;
};

export type AgentContextUsage = {
  agent_id: string;
  provider: string;
  model_id: string;
  max_context_window: number;
  system_prompt_tokens: number;
  tools_tokens: number;
  total_tokens: number;
  tool_count: number;
  tool_breakdown: ToolTokenUsage[];
  is_estimate: boolean;
};

const credentials = "include" as const;

export const agentsQueryKeys = {
  all: ["agents"] as const,
  catalog: () => [...agentsQueryKeys.all, "catalog"] as const,
  systemPrompt: (agentId: string) =>
    [...agentsQueryKeys.all, "system-prompt", agentId] as const,
  llmPreferences: (agentId: string) =>
    [...agentsQueryKeys.all, "llm-preferences", agentId] as const,
  contextUsage: (agentId: string, provider: string, modelId: string) =>
    [...agentsQueryKeys.all, "context-usage", agentId, provider, modelId] as const,
};

export function fetchAgents(): Promise<AgentSummary[]> {
  return apiFetch<AgentSummary[]>("/agents", { credentials });
}

export function fetchAgentSystemPrompt(agentId: string): Promise<AgentSystemPrompt> {
  return apiFetch<AgentSystemPrompt>(`/agents/${agentId}/system-prompt`, {
    credentials,
  });
}

export function fetchAgentContextUsage(agentId: string): Promise<AgentContextUsage> {
  return apiFetch<AgentContextUsage>(`/agents/${agentId}/context-usage`, {
    credentials,
  });
}

export function fetchAgentLlmPreferences(
  agentId: string,
): Promise<AgentLlmPreferences> {
  return apiFetch<AgentLlmPreferences>(`/agents/${agentId}/preferences`, {
    credentials,
  });
}

export function updateAgentLlmPreferences(
  agentId: string,
  payload: AgentLlmPreferencesUpdate,
): Promise<AgentLlmPreferences> {
  return apiFetch<AgentLlmPreferences>(`/agents/${agentId}/preferences`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function clearAgentLlmPreferences(
  agentId: string,
): Promise<AgentLlmPreferences> {
  return apiFetch<AgentLlmPreferences>(`/agents/${agentId}/preferences`, {
    method: "DELETE",
    credentials,
  });
}

export function updateAgent(
  agentId: string,
  payload: AgentUpdate,
): Promise<AgentSummary> {
  return apiFetch<AgentSummary>(`/agents/${agentId}`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}

export function updateAgentSystemPrompt(
  agentId: string,
  payload: AgentSystemPromptUpdate,
): Promise<AgentSystemPrompt> {
  return apiFetch<AgentSystemPrompt>(`/agents/${agentId}/system-prompt`, {
    method: "PATCH",
    credentials,
    body: payload,
  });
}
