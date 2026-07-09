// keel_web/src/modules/home/cards/layout/homeCardResize.ts

// Resize geometry for resizable home dashboard cards.

import { HOME_CARD_IDS, type HomeCardId } from "../../../../app/modules/homeCardTypes";

export type HomeCardResizeHandle =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

export type HomeCardRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type HomeCardBounds = {
  width: number;
  height: number;
};

export const HOME_CARD_RESIZE_HANDLES: HomeCardResizeHandle[] = [
  "n",
  "s",
  "e",
  "w",
  "ne",
  "nw",
  "se",
  "sw",
];

export const HOME_RESIZABLE_CARD_IDS = [
  HOME_CARD_IDS.slideshow,
  HOME_CARD_IDS.aliveTimer,
] as const;

export type HomeResizableCardId = (typeof HOME_RESIZABLE_CARD_IDS)[number];

export const DEFAULT_HOME_CARD_SIZE: Record<
  HomeResizableCardId,
  { width: number; height: number }
> = {
  [HOME_CARD_IDS.slideshow]: { width: 512, height: 360 },
  [HOME_CARD_IDS.aliveTimer]: { width: 512, height: 320 },
};

export const MIN_HOME_CARD_SIZE: Record<
  HomeResizableCardId,
  { width: number; height: number }
> = {
  [HOME_CARD_IDS.slideshow]: { width: 280, height: 220 },
  [HOME_CARD_IDS.aliveTimer]: { width: 280, height: 180 },
};

export function isHomeCardResizable(id: HomeCardId): boolean {
  return id === HOME_CARD_IDS.slideshow || id === HOME_CARD_IDS.aliveTimer;
}

export function resolveHomeCardSize(
  id: HomeCardId,
  stored?: { width?: number; height?: number },
): { width: number; height: number } | null {
  if (!isHomeCardResizable(id)) {
    return null;
  }

  const defaults = DEFAULT_HOME_CARD_SIZE[id as HomeResizableCardId];
  const mins = MIN_HOME_CARD_SIZE[id as HomeResizableCardId];

  return {
    width: Math.max(mins.width, stored?.width ?? defaults.width),
    height: Math.max(mins.height, stored?.height ?? defaults.height),
  };
}

export function clampHomeCardRect(
  rect: HomeCardRect,
  minWidth: number,
  minHeight: number,
  bounds: HomeCardBounds,
): HomeCardRect {
  const width = Math.min(Math.max(minWidth, rect.width), bounds.width);
  const height = Math.min(Math.max(minHeight, rect.height), bounds.height);
  const maxX = Math.max(0, bounds.width - width);
  const maxY = Math.max(0, bounds.height - height);

  return {
    x: Math.min(Math.max(0, rect.x), maxX),
    y: Math.min(Math.max(0, rect.y), maxY),
    width,
    height,
  };
}

export function applyHomeCardResize(
  origin: HomeCardRect,
  handle: HomeCardResizeHandle,
  deltaX: number,
  deltaY: number,
  minWidth: number,
  minHeight: number,
  bounds: HomeCardBounds,
): HomeCardRect {
  let { x, y, width, height } = origin;

  if (handle.includes("e")) {
    width += deltaX;
  }
  if (handle.includes("w")) {
    x += deltaX;
    width -= deltaX;
  }
  if (handle.includes("s")) {
    height += deltaY;
  }
  if (handle.includes("n")) {
    y += deltaY;
    height -= deltaY;
  }

  return clampHomeCardRect({ x, y, width, height }, minWidth, minHeight, bounds);
}
