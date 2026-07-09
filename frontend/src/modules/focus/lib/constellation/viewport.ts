// keel_web/src/modules/focus/lib/constellation/viewport.ts

// Viewport persistence helpers for the focus constellation canvas.

import type { Viewport } from "@xyflow/react";

import { FOCUS_CONSTELLATION_VIEWPORT_STORAGE_KEY } from "../focus";

export function isStoredViewport(value: unknown): value is Viewport {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<Viewport>;
  return (
    typeof candidate.x === "number" &&
    typeof candidate.y === "number" &&
    typeof candidate.zoom === "number"
  );
}

export function isDefaultTopLeftViewport(viewport: Viewport): boolean {
  return (
    Math.abs(viewport.x) < 0.001 &&
    Math.abs(viewport.y) < 0.001 &&
    Math.abs(viewport.zoom - 1) < 0.001
  );
}

export function readStoredConstellationViewport(): Viewport | null {
  try {
    const raw = window.localStorage.getItem(FOCUS_CONSTELLATION_VIEWPORT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!isStoredViewport(parsed)) {
      return null;
    }
    if (isDefaultTopLeftViewport(parsed)) {
      window.localStorage.removeItem(FOCUS_CONSTELLATION_VIEWPORT_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredConstellationViewport(viewport: Viewport) {
  if (isDefaultTopLeftViewport(viewport)) {
    return;
  }
  try {
    window.localStorage.setItem(
      FOCUS_CONSTELLATION_VIEWPORT_STORAGE_KEY,
      JSON.stringify({ x: viewport.x, y: viewport.y, zoom: viewport.zoom }),
    );
  } catch {
    // Ignore storage failures.
  }
}
