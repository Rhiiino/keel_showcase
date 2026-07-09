// stack_sandbox/frontend_web/src/modules/projects/lib/project/appearance/projectTitleFont.ts

// Title font options for project display across Kanban and detail views.

export type ProjectTitleFontKey =
  | "default"
  | "serif"
  | "mono"
  | "rounded"
  | "condensed"
  | "handwritten"
  | "display"
  | "elegant"
  | "slab"
  | "bold"
  | "retro"
  | "tech"
  | "classic"
  | "wide";

export const DEFAULT_TITLE_FONT_KEY: ProjectTitleFontKey = "default";

export type ProjectTitleFontOption = {
  key: ProjectTitleFontKey;
  label: string;
  family: string;
};

export const PROJECT_TITLE_FONT_OPTIONS: ProjectTitleFontOption[] = [
  {
    key: "default",
    label: "Default",
    family: 'ui-sans-serif, system-ui, sans-serif, "Segoe UI", sans-serif',
  },
  {
    key: "serif",
    label: "Serif",
    family: '"Instrument Serif", Georgia, "Times New Roman", serif',
  },
  {
    key: "mono",
    label: "Mono",
    family: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  {
    key: "rounded",
    label: "Rounded",
    family: 'Nunito, ui-sans-serif, system-ui, sans-serif',
  },
  {
    key: "condensed",
    label: "Condensed",
    family: 'Oswald, ui-sans-serif, system-ui, sans-serif',
  },
  {
    key: "handwritten",
    label: "Handwritten",
    family: 'Caveat, "Segoe Script", cursive',
  },
  {
    key: "display",
    label: "Display",
    family: '"Playfair Display", Georgia, "Times New Roman", serif',
  },
  {
    key: "elegant",
    label: "Elegant",
    family: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
  },
  {
    key: "slab",
    label: "Slab",
    family: '"Roboto Slab", Georgia, "Times New Roman", serif',
  },
  {
    key: "bold",
    label: "Bold",
    family: '"Bebas Neue", Impact, sans-serif',
  },
  {
    key: "retro",
    label: "Retro",
    family: 'Pacifico, "Segoe Script", cursive',
  },
  {
    key: "tech",
    label: "Tech",
    family: 'Orbitron, ui-sans-serif, system-ui, sans-serif',
  },
  {
    key: "classic",
    label: "Classic",
    family: '"Libre Baskerville", Georgia, "Times New Roman", serif',
  },
  {
    key: "wide",
    label: "Wide",
    family: '"Archivo Black", Impact, sans-serif',
  },
];

const FONT_BY_KEY = Object.fromEntries(
  PROJECT_TITLE_FONT_OPTIONS.map((option) => [option.key, option]),
) as Record<ProjectTitleFontKey, ProjectTitleFontOption>;

export function resolveProjectTitleFontKey(
  titleFontKey: string | null | undefined,
): ProjectTitleFontKey {
  if (!titleFontKey) {
    return DEFAULT_TITLE_FONT_KEY;
  }
  const normalized = titleFontKey.trim().toLowerCase() as ProjectTitleFontKey;
  if (FONT_BY_KEY[normalized]) {
    return normalized;
  }
  return DEFAULT_TITLE_FONT_KEY;
}

export function projectTitleFontFamily(
  titleFontKey: string | null | undefined,
): string {
  return FONT_BY_KEY[resolveProjectTitleFontKey(titleFontKey)].family;
}

export function projectTitleFontStyle(
  titleFontKey: string | null | undefined,
): { fontFamily: string } {
  return { fontFamily: projectTitleFontFamily(titleFontKey) };
}

export function projectTitleFontLabel(
  titleFontKey: string | null | undefined,
): string {
  return FONT_BY_KEY[resolveProjectTitleFontKey(titleFontKey)].label;
}
