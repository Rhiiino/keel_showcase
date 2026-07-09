// stack_sandbox/frontend_web/src/modules/projects/lib/workspace/canvas/workspaceCanvasSelection.ts

// Derive side-panel highlights from workspace canvas node selection.

import type { Node } from "@xyflow/react";

import type { WorkspaceMediaData } from "../projectWorkspace";

/** Number of `media` nodes per media id on the workspace canvas. */
export function canvasMediaCopyCounts(nodes: Node[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const node of nodes) {
    if (node.type !== "media") {
      continue;
    }
    const mediaId = (node.data as WorkspaceMediaData | undefined)?.media_id;
    if (typeof mediaId !== "string" || mediaId.length === 0) {
      continue;
    }
    counts[mediaId] = (counts[mediaId] ?? 0) + 1;
  }

  return counts;
}

export function serializeCanvasMediaCopyCounts(
  counts: Record<string, number>,
): string {
  return Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([mediaId, count]) => `${mediaId}:${count}`)
    .join("|");
}

/** Media ids for selected `media` nodes on the workspace canvas. */
export function selectedCanvasMediaIds(nodes: Node[]): string[] {
  const ids: string[] = [];

  for (const node of nodes) {
    if (!node.selected || node.type !== "media") {
      continue;
    }
    const mediaId = (node.data as WorkspaceMediaData | undefined)?.media_id;
    if (typeof mediaId === "string" && mediaId.length > 0) {
      ids.push(mediaId);
    }
  }

  return ids;
}
