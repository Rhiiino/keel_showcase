// stack_sandbox/frontend_web/src/modules/intelligence/pages/ModelsPage.tsx

// Models catalog — one tab per provider.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { AppShellContent } from "../../../app/shell/AppShellContent";
import {
  catalogQueryKeys,
  fetchCatalogModels,
  fetchProviders,
  type CatalogModel,
  type Provider,
} from "../../catalog/api";
import { providerLogoUrl } from "../../catalog/lib/providerDisplay";
import { formatContextWindow } from "../../chat/lib/model/modelDisplayUtils";
import { IntelligencePageHeader } from "../components/IntelligencePageHeader";
import { ModuleTabBar } from "../../../components/ModuleTabBar";
import { IntelligenceTabPanel } from "../components/IntelligenceTabPanel";
import { formatPricePer1M, groupModelsByProvider, sortProviders } from "../lib/display";

function ModelRow({ model }: { model: CatalogModel }) {
  const capabilityKeys = Object.keys(model.capabilities ?? {});

  return (
    <div className="rounded-lg border border-stone-800/80 bg-stone-950/40 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-stone-200">{model.display_name}</p>
          <p className="mt-0.5 font-mono text-xs text-stone-500">{model.id}</p>
        </div>
        {model.is_provider_default ? (
          <span className="rounded bg-sky-500/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sky-300 ring-1 ring-sky-500/30">
            Default
          </span>
        ) : null}
      </div>
      <dl className="mt-3 grid gap-2 text-xs text-stone-500 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="uppercase tracking-wider text-stone-600">Modality</dt>
          <dd className="mt-0.5 font-mono text-stone-400">{model.modality_key}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider text-stone-600">Context</dt>
          <dd className="mt-0.5 font-mono text-stone-400">
            {model.max_context_window
              ? formatContextWindow(model.max_context_window)
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider text-stone-600">Input / 1M</dt>
          <dd className="mt-0.5 font-mono text-stone-400">
            {formatPricePer1M(model.input_price_per_1m)}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider text-stone-600">Output / 1M</dt>
          <dd className="mt-0.5 font-mono text-stone-400">
            {formatPricePer1M(model.output_price_per_1m)}
          </dd>
        </div>
      </dl>
      {capabilityKeys.length > 0 ? (
        <p className="mt-2 font-mono text-[11px] text-stone-600">
          Capabilities: {capabilityKeys.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function ProviderPanel({
  provider,
  models,
}: {
  provider: Provider;
  models: CatalogModel[];
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 border-b border-stone-800 pb-4">
        <img
          src={providerLogoUrl(provider.key, provider.media)}
          alt=""
          className="h-10 w-10 rounded-lg border border-stone-800 bg-stone-950 object-contain p-1"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-stone-100">{provider.display_name}</h2>
          <p className="mt-0.5 font-mono text-xs text-stone-500">
            {provider.key}
            {provider.base_url ? ` · ${provider.base_url}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {models.length === 0 ? (
          <p className="text-sm text-stone-600">No models registered.</p>
        ) : (
          models.map((model) => <ModelRow key={model.id} model={model} />)
        )}
      </div>
    </div>
  );
}

export function ModelsPage() {
  const providersQuery = useQuery({
    queryKey: catalogQueryKeys.providers(),
    queryFn: fetchProviders,
  });
  const modelsQuery = useQuery({
    queryKey: catalogQueryKeys.models(),
    queryFn: () => fetchCatalogModels(),
  });

  const modelsByProvider = useMemo(
    () => groupModelsByProvider(modelsQuery.data ?? []),
    [modelsQuery.data],
  );

  const providers = useMemo(
    () => sortProviders(providersQuery.data ?? []),
    [providersQuery.data],
  );

  const [activeProviderKey, setActiveProviderKey] = useState<string | null>(null);

  useEffect(() => {
    if (providers.length === 0) {
      return;
    }
    if (activeProviderKey === null || !providers.some((p) => p.key === activeProviderKey)) {
      setActiveProviderKey(providers[0].key);
    }
  }, [activeProviderKey, providers]);

  const activeProvider = providers.find((provider) => provider.key === activeProviderKey);

  const isLoading = providersQuery.isLoading || modelsQuery.isLoading;
  const loadError = providersQuery.error ?? modelsQuery.error;

  const tabs = providers.map((provider) => ({
    id: provider.key,
    label: provider.display_name,
    icon: (
      <img
        src={providerLogoUrl(provider.key, provider.media)}
        alt=""
        className="h-6 w-6 rounded object-contain"
      />
    ),
  }));

  return (
    <AppShellContent>
      <div className="mx-auto w-full max-w-[100rem]">
        <IntelligencePageHeader
          title="Models"
          subtitle="Registered LLM providers and their models from the global catalog."
          recordCount={modelsQuery.data?.length}
        />

        {isLoading && (
          <p className="mt-12 text-sm text-stone-500">Loading models…</p>
        )}
        {loadError && (
          <p className="mt-12 text-sm text-red-400">Failed to load models.</p>
        )}

        {!isLoading && !loadError && providers.length > 0 && activeProviderKey && activeProvider ? (
          <>
            <ModuleTabBar
              tabs={tabs}
              activeId={activeProviderKey}
              onSelect={setActiveProviderKey}
              ariaLabel="Model providers"
            />
            <div className="mt-6">
              <IntelligenceTabPanel tabKey={activeProviderKey}>
                <ProviderPanel
                  provider={activeProvider}
                  models={modelsByProvider.get(activeProviderKey) ?? []}
                />
              </IntelligenceTabPanel>
            </div>
          </>
        ) : null}
      </div>
    </AppShellContent>
  );
}
