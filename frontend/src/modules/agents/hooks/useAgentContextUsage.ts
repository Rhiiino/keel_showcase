// stack_sandbox/frontend_web/src/modules/agents/hooks/useAgentContextUsage.ts

// Fetch context token estimates for an agent using effective provider/model prefs.

import { useQuery } from "@tanstack/react-query";

import { chatQueryKeys, fetchChatPreferences } from "../../chat/api";
import {
  agentsQueryKeys,
  fetchAgentContextUsage,
  fetchAgentLlmPreferences,
  type AgentContextUsage,
  type AgentSummary,
} from "../api";
import { isDraftAgent } from "../lib/draftAgent";

type UseAgentContextUsageResult = {
  usage: AgentContextUsage | undefined;
  isLoading: boolean;
  isError: boolean;
};

export function useAgentContextUsage(agent: AgentSummary): UseAgentContextUsageResult {
  const isDraft = isDraftAgent(agent);

  const agentPrefsQuery = useQuery({
    queryKey: agentsQueryKeys.llmPreferences(agent.id),
    queryFn: () => fetchAgentLlmPreferences(agent.id),
    enabled: !agent.is_orchestrator && !isDraft,
  });

  const chatPrefsQuery = useQuery({
    queryKey: chatQueryKeys.preferences(),
    queryFn: fetchChatPreferences,
    enabled: agent.is_orchestrator,
  });

  const provider = agent.is_orchestrator
    ? chatPrefsQuery.data?.provider
    : agentPrefsQuery.data?.provider;
  const modelId = agent.is_orchestrator
    ? chatPrefsQuery.data?.model_id
    : agentPrefsQuery.data?.model_id;

  const prefsLoading = agent.is_orchestrator
    ? chatPrefsQuery.isLoading
    : agentPrefsQuery.isLoading;

  const usageQuery = useQuery({
    queryKey: agentsQueryKeys.contextUsage(
      agent.id,
      provider ?? "pending",
      modelId ?? "pending",
    ),
    queryFn: () => fetchAgentContextUsage(agent.id),
    enabled: !isDraft && Boolean(provider && modelId),
  });

  return {
    usage: usageQuery.data,
    isLoading: prefsLoading || usageQuery.isLoading,
    isError: usageQuery.isError,
  };
}
