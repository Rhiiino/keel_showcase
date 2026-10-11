// stack_sandbox/frontend_web/src/modules/chat/lib/tools/toolCategoryDisplay.ts

// Tool category labels and icons from backend catalog media.

import { getApiBaseUrl } from "../../../../lib/api";

export type ToolCategoryDisplay = {
  label: string;
  icon: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  core: "Core",
  obsidian: "Obsidian",
  projects: "Projects",
  haul: "Shop",
  scripts: "Script",
  scrape: "Scrape",
  web: "Web",
  agenda: "Agenda",
};

function catalogCategoryIconUrl(categoryKey: string): string {
  return `${getApiBaseUrl()}/catalog/media/tool_categories/${categoryKey}/image.png`;
}

/** Registry of known tool categories and their display assets. */
export const TOOL_CATEGORY_DISPLAY: Record<string, ToolCategoryDisplay> =
  Object.fromEntries(
    Object.entries(CATEGORY_LABELS).map(([key, label]) => [
      key,
      { label, icon: catalogCategoryIconUrl(key) },
    ]),
  );

export function toolCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function toolCategoryIconSrc(category: string | null | undefined): string | null {
  if (!category) {
    return null;
  }
  return TOOL_CATEGORY_DISPLAY[category]?.icon ?? catalogCategoryIconUrl(category);
}
