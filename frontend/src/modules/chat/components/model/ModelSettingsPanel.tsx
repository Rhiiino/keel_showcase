// stack_sandbox/frontend_web/src/modules/chat/components/model/ModelSettingsPanel.tsx

// General tab — LLM provider, model selection, and context usage dial.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { agentsQueryKeys } from "../../../agents/api";
import {
  catalogQueryKeys,
  fetchProviders,
} from "../../../catalog/api";
import { buildProviderPickerEntries } from "../../../catalog/lib/providerDisplay";
import {
  chatQueryKeys,
  fetchChatPreferences,
  fetchMessages,
  fetchModels,
  updateChatPreferences,
  type ChatModel,
} from "../../api";
import { getLatestActualContextTokensUsed } from "../../lib/message";
import { ContextUsageDial } from "../status/ContextUsageDial";
import { GeneralTabSection } from "../status/GeneralTabSection";
import { ModelSelect } from "./ModelSelect";

type ModelSettingsPanelProps = {
  selectedConversationId: number | null;
};

function modelsForProvider(
  groups: { provider: string; models: ChatModel[] }[],
  provider: string,
): ChatModel[] {
  return groups.find((group) => group.provider === provider)?.models ?? [];
}

export function ModelSettingsPanel({
  selectedConversationId,
}: ModelSettingsPanelProps) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const modelsQuery = useQuery({
    queryKey: chatQueryKeys.models(),
    queryFn: fetchModels,
  });

  const providersQuery = useQuery({
    queryKey: catalogQueryKeys.providers(),
    queryFn: fetchProviders,
  });

  const preferencesQuery = useQuery({
    queryKey: chatQueryKeys.preferences(),
    queryFn: fetchChatPreferences,
  });

  const messagesQuery = useQuery({
    queryKey: chatQueryKeys.messages(selectedConversationId ?? 0),
    queryFn: () => fetchMessages(selectedConversationId!),
    enabled: selectedConversationId !== null,
  });

  const updateMutation = useMutation({
    mutationFn: updateChatPreferences,
    onSuccess: (updated) => {
      setActionError(null);
      queryClient.setQueryData(chatQueryKeys.preferences(), updated);
      void queryClient.invalidateQueries({ queryKey: agentsQueryKeys.all });
    },
    onError: (err: Error) => {
      setActionError(err.message);
    },
  });

  const preferences = preferencesQuery.data;
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

  const selectedModel = useMemo(() => {
    if (!preferences) {
      return null;
    }
    return (
      providerModels.find((model) => model.id === preferences.model_id) ??
      providerModels[0] ??
      null
    );
  }, [preferences, providerModels]);

  const maxContextWindow =
    selectedModel?.max_context_window ?? preferences?.max_context_window ?? 0;

  const tokensUsed = useMemo(() => {
    if (selectedConversationId === null || !messagesQuery.data) {
      return 0;
    }
    return getLatestActualContextTokensUsed(messagesQuery.data);
  }, [messagesQuery.data, selectedConversationId]);

  const handleProviderChange = (provider: string) => {
    if (!preferences || updateMutation.isPending) {
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
    if (!preferences || updateMutation.isPending) {
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

  const isLoading = modelsQuery.isLoading || preferencesQuery.isLoading;
  const loadError = modelsQuery.error ?? preferencesQuery.error;

  return (
    <GeneralTabSection
      title="Model"
      className="shrink-0 bg-stone-950/45 pb-4"
    >
      <div className="px-3 pt-3">
        {isLoading && (
          <p className="text-xs text-stone-500">Loading model settings…</p>
        )}

        {loadError && (
          <p className="text-xs text-red-400">Failed to load model settings.</p>
        )}

        {preferences && !isLoading && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {providers.map((provider) => {
                const isSelected = preferences.provider === provider.id;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    title={provider.label}
                    aria-label={provider.label}
                    aria-pressed={isSelected}
                    disabled={updateMutation.isPending}
                    onClick={() => handleProviderChange(provider.id)}
                    className={[
                      "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2 transition",
                      isSelected
                        ? "border-lime-400/50 bg-lime-400/5 ring-1 ring-lime-400/30"
                        : "border-stone-800 bg-stone-950/40 hover:border-stone-700",
                      updateMutation.isPending ? "opacity-60" : "",
                    ].join(" ")}
                  >
                    <img
                      src={provider.logo}
                      alt=""
                      className="h-7 w-7 rounded-md object-contain"
                    />
                    <span className="text-[10px] font-medium text-stone-400">
                      {provider.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <span className="text-[10px] uppercase tracking-wider text-stone-500">
                Model
              </span>
              <div className="mt-1 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <ModelSelect
                    models={providerModels}
                    value={preferences.model_id}
                    disabled={updateMutation.isPending}
                    onChange={handleModelChange}
                  />
                </div>
                <ContextUsageDial
                  tokensUsed={tokensUsed}
                  maxTokens={maxContextWindow}
                  disabled={selectedConversationId === null}
                />
              </div>
            </div>

            {updateMutation.isPending && (
              <p className="mt-2 text-[11px] text-stone-500">Saving…</p>
            )}
          </>
        )}

        {actionError && (
          <p className="mt-2 text-xs text-red-400">{actionError}</p>
        )}
      </div>
    </GeneralTabSection>
  );
}
