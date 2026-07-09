// keel_web/src/modules/projects/lib/workspace/node/workspaceNoteColorStyle.ts

// Resolves global note-card color display styles without changing stored note colors.
import {
  WORKSPACE_NOTE_COLOR_STYLE_DEFAULT,
  type WorkspaceNoteColorStyle,
} from "../panel/workspaceCanvasSettings";

export type WorkspaceNoteColorStyleSpec = {
  borderColor: string;
  fillColor: string;
  borderWidth: number;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return null;
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function colorWithAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function resolveWorkspaceNoteColorStyle(
  style: WorkspaceNoteColorStyle,
  colors: { border: string; fill: string },
): WorkspaceNoteColorStyleSpec {
  switch (style) {
    case "soft":
      return {
        borderColor: colorWithAlpha(colors.border, 0.72),
        fillColor: colorWithAlpha(colors.border, 0.16),
        borderWidth: 1,
      };
    case "outline":
      return {
        borderColor: colors.border,
        fillColor: "rgba(10, 10, 10, 0.28)",
        borderWidth: 2,
      };
    case "bold":
      return {
        borderColor: colors.border,
        fillColor: colors.fill,
        borderWidth: 4,
      };
    case "filled":
    default:
      return {
        borderColor: colors.border,
        fillColor: colors.fill,
        borderWidth: 2,
      };
  }
}

export function resolveWorkspaceNoteColorStyleOrDefault(
  style: WorkspaceNoteColorStyle | undefined,
  colors: { border: string; fill: string },
): WorkspaceNoteColorStyleSpec {
  return resolveWorkspaceNoteColorStyle(
    style ?? WORKSPACE_NOTE_COLOR_STYLE_DEFAULT,
    colors,
  );
}
