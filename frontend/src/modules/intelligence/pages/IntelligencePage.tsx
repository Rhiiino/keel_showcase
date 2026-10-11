// stack_sandbox/frontend_web/src/modules/intelligence/pages/IntelligencePage.tsx

// Intelligence hub — Models and Tools section cards.

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { AppShellContent } from "../../../app/shell/AppShellContent";
import {
  catalogQueryKeys,
  fetchCatalogModels,
  fetchCatalogTools,
  fetchProviders,
  fetchToolCategories,
} from "../../catalog/api";
import { IntelligenceSectionCard } from "../components/IntelligenceSectionCard";
import { intelligenceSections } from "../lib/sections";

export function IntelligencePage() {
  const providersQuery = useQuery({
    queryKey: catalogQueryKeys.providers(),
    queryFn: fetchProviders,
  });
  const modelsQuery = useQuery({
    queryKey: catalogQueryKeys.models(),
    queryFn: () => fetchCatalogModels(),
  });
  const categoriesQuery = useQuery({
    queryKey: catalogQueryKeys.toolCategories(),
    queryFn: fetchToolCategories,
  });
  const toolsQuery = useQuery({
    queryKey: catalogQueryKeys.tools(),
    queryFn: fetchCatalogTools,
  });

  const countLabels = useMemo(() => {
    const modelCount = modelsQuery.data?.length;
    const providerCount = providersQuery.data?.length;
    const toolCount = toolsQuery.data?.length;
    const categoryCount = categoriesQuery.data?.length;

    return {
      models:
        modelCount !== undefined && providerCount !== undefined
          ? `${modelCount} model${modelCount === 1 ? "" : "s"} across ${providerCount} provider${providerCount === 1 ? "" : "s"}`
          : undefined,
      tools:
        toolCount !== undefined && categoryCount !== undefined
          ? `${toolCount} tool${toolCount === 1 ? "" : "s"} in ${categoryCount} categor${categoryCount === 1 ? "y" : "ies"}`
          : undefined,
    };
  }, [
    categoriesQuery.data?.length,
    modelsQuery.data?.length,
    providersQuery.data?.length,
    toolsQuery.data?.length,
  ]);

  return (
    <AppShellContent>
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
        <header className="shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
            Intelligence
          </h1>
          <p className="mt-2 max-w-xl text-sm text-stone-500">
            Read-only catalog of Keel&apos;s AI components — providers, models, tools, and
            categories.
          </p>
        </header>

        <div className="mt-8 flex flex-wrap gap-6">
          {intelligenceSections.map((section) => (
            <IntelligenceSectionCard
              key={section.id}
              section={section}
              countLabel={countLabels[section.id]}
            />
          ))}
        </div>
      </div>
    </AppShellContent>
  );
}
