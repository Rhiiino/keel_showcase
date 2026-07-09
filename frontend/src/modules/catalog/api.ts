// stack_sandbox/frontend_web/src/modules/catalog/api.ts

// Intelligence catalog read API (modalities, providers, models, tool categories).

import { apiFetch } from "../../lib/api";

export type CatalogMedia = {
  id: number;
  media_kind: string;
  role: string | null;
  mime_type: string;
  url: string;
  sort_order: number;
};

export type Modality = {
  key: string;
  display_name: string;
  description: string;
  sort_order: number;
};

export type CatalogModel = {
  id: string;
  provider: string;
  modality_key: string;
  display_name: string;
  max_context_window: number | null;
  input_price_per_1m: number | null;
  output_price_per_1m: number | null;
  capabilities: Record<string, unknown>;
  is_enabled: boolean;
  is_provider_default: boolean;
  sort_order: number;
  media: CatalogMedia[];
};

export type Provider = {
  key: string;
  display_name: string;
  base_url: string | null;
  is_enabled: boolean;
  sort_order: number;
  config: Record<string, unknown>;
  media: CatalogMedia[];
};

export type ToolCategory = {
  key: string;
  display_name: string;
  description: string;
  sort_order: number;
  media: CatalogMedia[];
};

export type CatalogTool = {
  name: string;
  category: string;
  description: string;
  parameters: Record<string, unknown>;
  returns: string;
  examples: string[] | null;
  is_enabled: boolean;
};

const credentials = "include" as const;

export const catalogQueryKeys = {
  all: ["catalog"] as const,
  modalities: () => [...catalogQueryKeys.all, "modalities"] as const,
  providers: () => [...catalogQueryKeys.all, "providers"] as const,
  models: (modalityKey?: string) =>
    [...catalogQueryKeys.all, "models", modalityKey ?? "all"] as const,
  toolCategories: () => [...catalogQueryKeys.all, "tool-categories"] as const,
  tools: () => [...catalogQueryKeys.all, "tools"] as const,
};

export function fetchModalities(): Promise<Modality[]> {
  return apiFetch<Modality[]>("/catalog/modalities", { credentials });
}

export function fetchCatalogModels(modalityKey?: string): Promise<CatalogModel[]> {
  const query = modalityKey ? `?modality_key=${encodeURIComponent(modalityKey)}` : "";
  return apiFetch<CatalogModel[]>(`/catalog/models${query}`, { credentials });
}

export function fetchProviders(): Promise<Provider[]> {
  return apiFetch<Provider[]>("/catalog/providers", { credentials });
}

export function fetchToolCategories(): Promise<ToolCategory[]> {
  return apiFetch<ToolCategory[]>("/catalog/tool-categories", { credentials });
}

export function fetchCatalogTools(): Promise<CatalogTool[]> {
  return apiFetch<CatalogTool[]>("/catalog/tools", { credentials });
}
