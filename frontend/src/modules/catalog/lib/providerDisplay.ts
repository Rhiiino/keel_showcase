// stack_sandbox/frontend_web/src/modules/catalog/lib/providerDisplay.ts

// Provider labels and logo URLs from backend catalog media.

import { getApiBaseUrl } from "../../../lib/api";
import type { CatalogMedia, Provider } from "../api";

export const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  moonshot: "Moonshot",
};

const PROVIDER_IMAGE_EXTENSIONS: Record<string, string> = {
  moonshot: "jpg",
};

function catalogMediaUrl(storageKey: string): string {
  return `${getApiBaseUrl()}/catalog/media/${storageKey}`;
}

function mediaByRole(
  media: CatalogMedia[] | undefined,
  role: string,
): CatalogMedia | undefined {
  if (!media?.length) {
    return undefined;
  }
  return media.find((item) => item.media_kind === "image" && item.role === role);
}

function defaultProviderStorageKey(providerKey: string): string {
  const ext = PROVIDER_IMAGE_EXTENSIONS[providerKey] ?? "png";
  return `providers/${providerKey}/image.${ext}`;
}

/** Display label for a provider key. */
export function providerLabel(providerKey: string): string {
  return PROVIDER_LABELS[providerKey] ?? providerKey;
}

/** Logo URL for a provider (API media or predictable catalog path). */
export function providerLogoUrl(
  providerKey: string,
  media?: CatalogMedia[],
): string {
  const fromApi = mediaByRole(media, "logo");
  if (fromApi) {
    return fromApi.url.startsWith("http")
      ? fromApi.url
      : `${getApiBaseUrl()}${fromApi.url}`;
  }
  return catalogMediaUrl(defaultProviderStorageKey(providerKey));
}

/** Known provider keys in display order (fallback when catalog is loading). */
export const KNOWN_PROVIDER_KEYS = ["openai", "anthropic", "moonshot"] as const;

export type ProviderPickerEntry = {
  id: string;
  label: string;
  logo: string;
};

/** Build provider picker entries from catalog providers or static fallbacks. */
export function buildProviderPickerEntries(
  providers?: Provider[],
): ProviderPickerEntry[] {
  if (providers?.length) {
    return providers.map((provider) => ({
      id: provider.key,
      label: provider.display_name,
      logo: providerLogoUrl(provider.key, provider.media),
    }));
  }
  return KNOWN_PROVIDER_KEYS.map((key) => ({
    id: key,
    label: providerLabel(key),
    logo: providerLogoUrl(key),
  }));
}
