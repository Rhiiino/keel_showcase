// stack_sandbox/frontend_web/src/modules/intelligence/lib/display.ts

// Display helpers for Intelligence catalog pages.

import type { CatalogModel, CatalogTool, Provider, ToolCategory } from "../../catalog/api";

export function groupModelsByProvider(
  models: CatalogModel[],
): Map<string, CatalogModel[]> {
  const grouped = new Map<string, CatalogModel[]>();
  for (const model of models) {
    const list = grouped.get(model.provider) ?? [];
    list.push(model);
    grouped.set(model.provider, list);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
  }
  return grouped;
}

export function groupToolsByCategory(
  tools: CatalogTool[],
): Map<string, CatalogTool[]> {
  const grouped = new Map<string, CatalogTool[]>();
  for (const tool of tools) {
    const list = grouped.get(tool.category) ?? [];
    list.push(tool);
    grouped.set(tool.category, list);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }
  return grouped;
}

export function sortProviders(providers: Provider[]): Provider[] {
  return [...providers].sort(
    (a, b) => a.sort_order - b.sort_order || a.key.localeCompare(b.key),
  );
}

export function sortToolCategories(categories: ToolCategory[]): ToolCategory[] {
  return [...categories].sort(
    (a, b) => a.sort_order - b.sort_order || a.key.localeCompare(b.key),
  );
}

export function formatPricePer1M(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (value >= 1) {
    return `$${value.toFixed(2)}`;
  }
  if (value >= 0.01) {
    return `$${value.toFixed(2)}`;
  }
  return `$${value.toFixed(3)}`;
}
