// stack_sandbox/frontend_web/src/modules/agents/components/AgentModelSettings.tsx

// Per-agent LLM provider and model picker (Keel uses global chat prefs; sub-agents may override).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  catalogQueryKeys,
  fetchProviders,
} from "../../catalog/api";
import { buildProviderPickerEntries } from "../../catalog/lib/providerDisplay";
import {
  chatQueryKeys,
  fetchChatPreferences,
  fetchModels,
  updateChatPreferences,
  type ChatModel,
  type ModelProviderGroup,
} from "../../chat/api";
import { ModelSelect } from "../../chat/components/model";
import { SwitchToggle } from "../../chat/components/common";
import {
  agentsQueryKeys,
  clearAgentLlmPreferences,
  fetchAgentLlmPreferences,
  updateAgentLlmPreferences,
} from "../api";

type AgentModelSettingsProps = {
  agentId: string;
  isOrchestrator?: boolean;
  /** `column` fits the detail panel right rail; default is stacked for narrow layouts. */
  layout?: "column" | "stacked";
};

function modelsForProvider(
  groups: ModelProviderGroup[],
  provider: string,
): ChatModel[] {
  return groups.find((group) => group.provider === provider)?.models ?? [];
}

export function AgentModelSettings({
  agentId,
  isOrchestrator = false,
  layout = "stacked",
}: AgentModelSettingsProps) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [customUnlocked, setCustomUnlocked] = useState(false);

  const modelsQuery = useQuery({
    queryKey: chatQueryKeys.models(),
    queryFn: fetchModels,
  });

  const providersQuery = useQuery({
    queryKey: catalogQueryKeys.providers(),
    queryFn: fetchProviders,
  });

  const preferencesQuery = useQuery({
    queryKey: isOrchestrator
      ? chatQueryKeys.preferences()
      : agentsQueryKeys.llmPreferences(agentId),
    queryFn: isOrchestrator
      ? fetchChatPreferences
      : () => fetchAgentLlmPreferences(agentId),
  });

  const preferences = preferencesQuery.data;
  const hasOverride =
    !isOrchestrator &&
    preferences !== undefined &&
    "has_override" in preferences &&
    preferences.has_override;

  useEffect(() => {
    setCustomUnlocked(false);
  }, [agentId]);

  useEffect(() => {
    if (hasOverride) {
      setCustomUnlocked(false);
    }
  }, [hasOverride]);

  const invalidateRelatedQueries = () => {
    void queryClient.invalidateQueries({
      queryKey: [...agentsQueryKeys.all, "context-usage", agentId],
    });
    if (isOrchestrator) {
      void queryClient.invalidateQueries({ queryKey: agentsQueryKeys.all });
    }
  };

  const updateMutation = useMutation({
    mutationFn: (payload: { provider: string; model_id: string }) =>
      isOrchestrator
        ? updateChatPreferences(payload)
        : updateAgentLlmPreferences(agentId, payload),
    onSuccess: (updated) => {
      setActionError(null);
      setCustomUnlocked(false);
      if (isOrchestrator) {
        queryClient.setQueryData(chatQueryKeys.preferences(), updated);
      } else {
        queryClient.setQueryData(agentsQueryKeys.llmPreferences(agentId), updated);
      }
      invalidateRelatedQueries();
    },
    onError: (err: Error) => {
      setActionError(err.message);
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearAgentLlmPreferences(agentId),
    onSuccess: (updated) => {
      setActionError(null);
      setCustomUnlocked(false);
      queryClient.setQueryData(agentsQueryKeys.llmPreferences(agentId), updated);
      invalidateRelatedQueries();
    },
    onError: (err: Error) => {
      setActionError(err.message);
    },
  });

  const modelGroups = modelsQuery.data ?? [];
  const providers = useMemo(
    () => buildProviderPickerEntries(providersQuery.data),
    [providersQuery.data],
  );

  const providerModels = useMemo(() => {
    if (!preferences) {
      return [];
    }
    return modelsForProvider(modelGroups, preferences.provider);
  }, [modelGroups, preferences]);

  const handleProviderChange = (provider: string) => {
    if (!preferences || updateMutation.isPending || clearMutation.isPending) {
      return;
    }
    if (provider === preferences.provider) {
      return;
    }

    const nextModels = modelsForProvider(modelGroups, provider);
    const nextModel = nextModels[0];
    if (!nextModel) {
      setActionError(`No models available for ${provider}.`);
      return;
    }

    updateMutation.mutate({
      provider,
      model_id: nextModel.id,
    });
  };

  const handleModelChange = (modelId: string) => {
    if (!preferences || updateMutation.isPending || clearMutation.isPending) {
      return;
    }
    if (modelId === preferences.model_id) {
      return;
    }

    updateMutation.mutate({
      provider: preferences.provider,
      model_id: modelId,
    });
  };

  const handleUseMainAgentToggle = (useMainAgent: boolean) => {
    if (
      isOrchestrator ||
      !preferences ||
      clearMutation.isPending ||
      updateMutation.isPending
    ) {
      return;
    }

    if (useMainAgent) {
      setCustomUnlocked(false);
      if (hasOverride) {
        clearMutation.mutate();
      }
      return;
    }

    // Unlock custom pickers immediately, then persist an override so refresh
    // keeps custom mode even before the user changes provider/model.
    setCustomUnlocked(true);
    if (!hasOverride) {
      updateMutation.mutate({
        provider: preferences.provider,
        model_id: preferences.model_id,
      });
    }
  };

  const isLoading = modelsQuery.isLoading || preferencesQuery.isLoading;
  const loadError = modelsQuery.error ?? preferencesQuery.error;
  const isPending =
    updateMutation.isPending || clearMutation.isPending;

  if (isLoading) {
    return <p className="text-sm text-stone-500">Loading model settings…</p>;
  }

  if (loadError) {
    return <p className="text-sm text-red-400">Failed to load model settings.</p>;
  }

  if (!preferences) {
    return null;
  }

  const useMainAgentModel =
    !isOrchestrator && !hasOverride && !customUnlocked;
  const pickersDisabled = isPending || useMainAgentModel;

  const providerGridClass =
    layout === "column" ? "grid grid-cols-3 gap-1.5" : "grid grid-cols-3 gap-2";

  return (
    <div>
      {!isOrchestrator && (
        <div className="mb-3">
          <SwitchToggle
            checked={useMainAgentModel}
            onChange={handleUseMainAgentToggle}
            disabled={isPending}
            label="Use main agent model"
          />
        </div>
      )}

      <div
        className={[
          pickersDisabled && !isPending ? "opacity-45" : "",
          pickersDisabled && !isPending ? "pointer-events-none" : "",
        ].join(" ")}
      >
        <div className={providerGridClass}>
          {providers.map((provider) => {
            const isSelected = preferences.provider === provider.id;
            return (
              <button
                key={provider.id}
                type="button"
                title={provider.label}
                aria-label={provider.label}
                aria-pressed={isSelected}
                disabled={pickersDisabled}
                onClick={() => handleProviderChange(provider.id)}
                className={[
                  "flex flex-col items-center gap-1 rounded-xl border px-1.5 py-1.5 transition",
                  layout === "column" ? "sm:px-2 sm:py-2" : "gap-1.5 px-2 py-2",
                  isSelected
                    ? "border-violet-400/50 bg-violet-400/5 ring-1 ring-violet-400/30"
                    : "border-stone-800 bg-stone-950/40 hover:border-stone-700",
                  pickersDisabled ? "cursor-not-allowed" : "",
                ].join(" ")}
              >
                <img
                  src={provider.logo}
                  alt=""
                  className={[
                    "rounded-md object-contain",
                    layout === "column" ? "h-8 w-8" : "h-7 w-7",
                  ].join(" ")}
                />
                <span
                  className={[
                    "font-medium text-stone-300",
                    layout === "column" ? "text-xs" : "text-[10px]",
                  ].join(" ")}
                >
                  {provider.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className={layout === "column" ? "mt-3" : "mt-4"}>
          <span
            className={[
              "uppercase tracking-wider text-stone-400",
              layout === "column" ? "text-xs" : "text-[10px]",
            ].join(" ")}
          >
            Model
          </span>
          <div className="mt-1.5">
            <ModelSelect
              models={providerModels}
              value={preferences.model_id}
              disabled={pickersDisabled || providerModels.length === 0}
              onChange={handleModelChange}
            />
          </div>
        </div>
      </div>

      {actionError && (
        <p className="mt-2 text-sm text-red-400">{actionError}</p>
      )}
    </div>
  );
}
