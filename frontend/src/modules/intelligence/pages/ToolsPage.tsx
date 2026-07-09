// stack_sandbox/frontend_web/src/modules/intelligence/pages/ToolsPage.tsx

// Tools catalog — one tab per category.

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { AppShellContent } from "../../../app/shell/AppShellContent";
import {
  catalogQueryKeys,
  fetchCatalogTools,
  fetchToolCategories,
  type CatalogTool,
  type ToolCategory,
} from "../../catalog/api";
import { ToolCategoryIcon } from "../../chat/components/status";
import { toolCategoryLabel } from "../../chat/lib/tools";
import { IntelligencePageHeader } from "../components/IntelligencePageHeader";
import { ModuleTabBar } from "../../../components/ModuleTabBar";
import { IntelligenceTabPanel } from "../components/IntelligenceTabPanel";
import { groupToolsByCategory, sortToolCategories } from "../lib/display";

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={[
        "h-4 w-4 shrink-0 text-stone-500 transition",
        expanded ? "rotate-180" : "",
      ].join(" ")}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ToolEntry({ tool }: { tool: CatalogTool }) {
  const [expanded, setExpanded] = useState(false);
  const hasParameters = Object.keys(tool.parameters ?? {}).length > 0;

  return (
    <div className="rounded-lg border border-stone-800/80 bg-stone-950/40 px-4 py-3">
      <div>
        <p className="font-mono text-sm font-medium text-stone-200">{tool.name}</p>
        <p className="mt-1 text-sm leading-relaxed text-stone-500">{tool.description}</p>
      </div>

      <p className="mt-2 font-mono text-xs text-stone-600">
        Returns: <span className="text-stone-400">{tool.returns}</span>
      </p>

      {hasParameters ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 flex w-full items-center gap-2 text-left text-xs text-stone-500 transition hover:text-stone-300"
        >
          <ChevronIcon expanded={expanded} />
          Parameters schema
        </button>
      ) : null}

      {expanded && hasParameters ? (
        <pre className="mt-2 max-h-64 overflow-auto rounded border border-stone-800 bg-stone-950 p-3 font-mono text-xs leading-relaxed text-stone-400">
          {JSON.stringify(tool.parameters, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

function CategoryPanel({
  category,
  tools,
}: {
  category: ToolCategory;
  tools: CatalogTool[];
}) {
  return (
    <div>
      <div className="flex flex-wrap items-start gap-4 border-b border-stone-800 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-800 bg-stone-950">
          <ToolCategoryIcon category={category.key} size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-stone-100">{category.display_name}</h2>
          <p className="mt-0.5 font-mono text-xs text-stone-500">
            {category.key} · {tools.length} tool{tools.length === 1 ? "" : "s"}
          </p>
          {category.description ? (
            <p className="mt-2 text-sm text-stone-500">{category.description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {tools.length === 0 ? (
          <p className="text-sm text-stone-600">
            No tools in {toolCategoryLabel(category.key)}.
          </p>
        ) : (
          tools.map((tool) => <ToolEntry key={tool.name} tool={tool} />)
        )}
      </div>
    </div>
  );
}

export function ToolsPage() {
  const categoriesQuery = useQuery({
    queryKey: catalogQueryKeys.toolCategories(),
    queryFn: fetchToolCategories,
  });
  const toolsQuery = useQuery({
    queryKey: catalogQueryKeys.tools(),
    queryFn: fetchCatalogTools,
  });

  const toolsByCategory = useMemo(
    () => groupToolsByCategory(toolsQuery.data ?? []),
    [toolsQuery.data],
  );

  const categories = useMemo(
    () => sortToolCategories(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");

  const activeCategoryKey = useMemo(() => {
    if (categories.length === 0) {
      return null;
    }
    if (categoryParam && categories.some((category) => category.key === categoryParam)) {
      return categoryParam;
    }
    return categories[0].key;
  }, [categories, categoryParam]);

  const selectCategory = (categoryKey: string) => {
    setSearchParams({ category: categoryKey }, { replace: true });
  };

  const activeCategory = categories.find((category) => category.key === activeCategoryKey);

  const isLoading = categoriesQuery.isLoading || toolsQuery.isLoading;
  const loadError = categoriesQuery.error ?? toolsQuery.error;

  const tabs = categories.map((category) => ({
    id: category.key,
    label: category.display_name,
    icon: <ToolCategoryIcon category={category.key} size="sm" />,
  }));

  return (
    <AppShellContent>
      <div className="mx-auto w-full max-w-[100rem]">
        <IntelligencePageHeader
          title="Tools"
          subtitle="Tool categories and the registered tools available to agents."
          recordCount={toolsQuery.data?.length}
        />

        {isLoading && (
          <p className="mt-12 text-sm text-stone-500">Loading tools…</p>
        )}
        {loadError && (
          <p className="mt-12 text-sm text-red-400">Failed to load tools.</p>
        )}

        {!isLoading && !loadError && categories.length > 0 && activeCategoryKey && activeCategory ? (
          <>
            <ModuleTabBar
              tabs={tabs}
              activeId={activeCategoryKey}
              onSelect={selectCategory}
              ariaLabel="Tool categories"
            />
            <div className="mt-6">
              <IntelligenceTabPanel tabKey={activeCategoryKey}>
                <CategoryPanel
                  category={activeCategory}
                  tools={toolsByCategory.get(activeCategoryKey) ?? []}
                />
              </IntelligenceTabPanel>
            </div>
          </>
        ) : null}
      </div>
    </AppShellContent>
  );
}
