// keel_web/src/modules/projects/lib/workspace/workspaceMediaAspect.ts

// Helpers for matching workspace media node bounds to intrinsic media aspect ratio.

import type { Node } from "@xyflow/react";

function parsePixelSize(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

export function resolveNodePixelSize(node: Node): { width: number; height: number } {
  const width =
    parsePixelSize(node.width) ??
    parsePixelSize(node.style?.width) ??
    parsePixelSize(node.measured?.width) ??
    320;
  const height =
    parsePixelSize(node.height) ??
    parsePixelSize(node.style?.height) ??
    parsePixelSize(node.measured?.height) ??
    240;
  return { width, height };
}

export function dimensionsForMediaAspect(
  aspect: number,
  referenceWidth: number,
  minWidth = 120,
  minContentHeight = 80,
  titleReserve = 0,
): { width: number; height: number } {
  const safeAspect = aspect > 0 ? aspect : 1;
  const width = Math.max(minWidth, referenceWidth);
  const contentHeight = Math.max(
    minContentHeight,
    Math.round(width / safeAspect),
  );
  return { width, height: contentHeight + titleReserve };
}

export function aspectsAreClose(a: number, b: number, tolerance = 0.05): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) {
    return false;
  }
  return Math.abs(a - b) / b <= tolerance;
}
