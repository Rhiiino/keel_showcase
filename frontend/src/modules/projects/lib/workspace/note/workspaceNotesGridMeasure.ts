// keel_web/src/modules/projects/lib/workspace/note/workspaceNotesGridMeasure.ts

// DOM measurement helpers for workspace notes grid fit layout.

import type { WorkspaceNotesGridNoteMeasure } from "./workspaceNotesGridLayout";

export const WORKSPACE_NOTES_GRID_MEASURE_COL_SPANS = [12, 6, 4, 3] as const;

export function collectNotesGridMeasuresFromLayer(
  layer: HTMLElement,
): WorkspaceNotesGridNoteMeasure[] {
  const byId = new Map<string, WorkspaceNotesGridNoteMeasure>();

  for (const element of layer.querySelectorAll<HTMLElement>("[data-notes-grid-measure-id]")) {
    const id = element.dataset.notesGridMeasureId;
    const colSpanRaw = element.dataset.notesGridMeasureColSpan;
    if (!id || !colSpanRaw) {
      continue;
    }

    const colSpan = Number(colSpanRaw);
    if (!Number.isFinite(colSpan) || colSpan <= 0) {
      continue;
    }

    const heightPx = Math.ceil(element.getBoundingClientRect().height);
    const minWidthPx = Math.ceil(element.scrollWidth);

    const existing = byId.get(id) ?? {
      id,
      heightByColSpan: {},
      minWidthPx: 0,
    };
    existing.heightByColSpan[colSpan] = Math.max(existing.heightByColSpan[colSpan] ?? 0, heightPx);
    existing.minWidthPx = Math.max(existing.minWidthPx, minWidthPx);
    byId.set(id, existing);
  }

  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}
