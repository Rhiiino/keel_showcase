// stack_sandbox/frontend_web/src/modules/projects/lib/project/projectTagDisplay.ts

// Color helpers for project tag pills.

export function normalizeHexColor(colorHex: string): string {
  return colorHex.trim().toUpperCase();
}

function hexToRgb(colorHex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHexColor(colorHex);
  const match = /^#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/.exec(normalized);
  if (!match) {
    return null;
  }

  return {
    r: Number.parseInt(match[1], 16),
    g: Number.parseInt(match[2], 16),
    b: Number.parseInt(match[3], 16),
  };
}

export function projectTagPillTextColor(colorHex: string): string {
  const rgb = hexToRgb(colorHex);
  if (!rgb) {
    return "#F5F5F4";
  }

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.62 ? "#1C1917" : "#FAFAF9";
}

export function projectTagPillStyle(colorHex: string): {
  backgroundColor: string;
  color: string;
  borderColor: string;
} {
  const backgroundColor = normalizeHexColor(colorHex);
  return {
    backgroundColor: `${backgroundColor}33`,
    color: projectTagPillTextColor(backgroundColor),
    borderColor: `${backgroundColor}66`,
  };
}

export const DEFAULT_PROJECT_TAG_COLOR = "#06B6D4";

export function sameTagIdSets(left: number[], right: number[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const sortedLeft = [...left].sort((a, b) => a - b);
  const sortedRight = [...right].sort((a, b) => a - b);
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}
