// Obsidian-style preset palette for workspace note nodes (border + darker fill).

export type WorkspaceNoteColor = {
  id: string;
  label: string;
  border: string;
  fill: string;
};

export const WORKSPACE_NOTE_COLORS: WorkspaceNoteColor[] = [
  { id: "stone", label: "Stone", border: "#57534e", fill: "#1c1917" },
  { id: "slate", label: "Slate", border: "#64748b", fill: "#1e293b" },
  { id: "red", label: "Red", border: "#ef4444", fill: "#450a0a" },
  { id: "orange", label: "Orange", border: "#ea580c", fill: "#431407" },
  { id: "yellow", label: "Yellow", border: "#ca8a04", fill: "#422006" },
  { id: "green", label: "Green", border: "#16a34a", fill: "#052e16" },
  { id: "blue", label: "Blue", border: "#2563eb", fill: "#172554" },
  { id: "purple", label: "Purple", border: "#9333ea", fill: "#3b0764" },
];

export const DEFAULT_WORKSPACE_NOTE_COLOR = WORKSPACE_NOTE_COLORS[0];

export function normalizeNoteColor(hex: string | null | undefined): string {
  if (!hex) {
    return DEFAULT_WORKSPACE_NOTE_COLOR.border;
  }
  return hex.trim().toLowerCase();
}

function findColorByBorder(border: string): WorkspaceNoteColor | undefined {
  const normalized = normalizeNoteColor(border);
  return WORKSPACE_NOTE_COLORS.find(
    (color) => color.border.toLowerCase() === normalized,
  );
}

function findColorByFill(fill: string): WorkspaceNoteColor | undefined {
  const normalized = normalizeNoteColor(fill);
  return WORKSPACE_NOTE_COLORS.find(
    (color) => color.fill.toLowerCase() === normalized,
  );
}

export function resolveNoteColors(stored?: string | null): {
  border: string;
  fill: string;
} {
  const normalized = normalizeNoteColor(stored);

  const byBorder = findColorByBorder(normalized);
  if (byBorder) {
    return { border: byBorder.border, fill: byBorder.fill };
  }

  const byFill = findColorByFill(normalized);
  if (byFill) {
    return { border: byFill.border, fill: byFill.fill };
  }

  return {
    border: DEFAULT_WORKSPACE_NOTE_COLOR.border,
    fill: DEFAULT_WORKSPACE_NOTE_COLOR.fill,
  };
}

export function noteColorToStored(border: string): string {
  return normalizeNoteColor(border);
}

export const DEFAULT_WORKSPACE_EDGE_COLOR = "#71717a";

export function resolveEdgeColor(stored?: string | null): string {
  if (!stored) {
    return DEFAULT_WORKSPACE_EDGE_COLOR;
  }
  return normalizeNoteColor(stored);
}
