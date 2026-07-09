// keel_web/src/modules/auth/lib/loginScatterPlacement.ts

// Random viewport placement for scatter login persona spots (avoids center + edges).

export const LOGIN_SCATTER_PERSONA_SIZE_PX = 130;
export const LOGIN_SCATTER_HEAD_OVERFLOW_RATIO = 0.28;
export const LOGIN_SCATTER_TELEPORT_MS = 400;
/** How long each spot plays at rest after arrival, before teleporting to the next position. */
export const LOGIN_SCATTER_PLAY_MS = 5000;
export const LOGIN_SCATTER_EDGE_PADDING_PX = 20;
export const LOGIN_SCATTER_MIN_SEPARATION_PX = 140;
export const LOGIN_SCATTER_DESCRIPTOR_GAP_PX = 12;
export const LOGIN_SCATTER_DESCRIPTOR_MAX_WIDTH_PX = 176;

export type ViewportSize = {
  width: number;
  height: number;
};

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function loginScatterDisplayHeightPx(
  sizePx = LOGIN_SCATTER_PERSONA_SIZE_PX,
): number {
  return Math.ceil(sizePx * (1 + LOGIN_SCATTER_HEAD_OVERFLOW_RATIO));
}

export function loginScatterPlayDurationMs(): number {
  return LOGIN_SCATTER_PLAY_MS;
}

export function loginScatterClusterHalfWidthPx(
  sizePx = LOGIN_SCATTER_PERSONA_SIZE_PX,
): number {
  return (
    sizePx / 2 +
    LOGIN_SCATTER_DESCRIPTOR_GAP_PX +
    LOGIN_SCATTER_DESCRIPTOR_MAX_WIDTH_PX
  );
}

function loginScatterCenterExclusionRect(viewport: ViewportSize): Rect {
  const width = Math.min(340, viewport.width * 0.44);
  const height = Math.min(440, viewport.height * 0.5);

  return {
    left: (viewport.width - width) / 2,
    top: (viewport.height - height) / 2,
    width,
    height,
  };
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(
    a.left + a.width <= b.left ||
    b.left + b.width <= a.left ||
    a.top + a.height <= b.top ||
    b.top + b.height <= a.top
  );
}

function personaBoundsAt(
  centerX: number,
  centerY: number,
  sizePx: number,
): Rect {
  const width = loginScatterClusterHalfWidthPx(sizePx) * 2;
  const height = loginScatterDisplayHeightPx(sizePx);

  return {
    left: centerX - width / 2,
    top: centerY - height / 2,
    width,
    height,
  };
}

function distanceBetween(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function pickLoginScatterPosition(
  viewport: ViewportSize,
  options?: {
    sizePx?: number;
    edgePadding?: number;
    avoidCenter?: { x: number; y: number };
    minSeparationPx?: number;
  },
): { x: number; y: number } {
  const sizePx = options?.sizePx ?? LOGIN_SCATTER_PERSONA_SIZE_PX;
  const edgePadding = options?.edgePadding ?? LOGIN_SCATTER_EDGE_PADDING_PX;
  const minSeparationPx =
    options?.minSeparationPx ?? LOGIN_SCATTER_MIN_SEPARATION_PX;
  const exclusion = loginScatterCenterExclusionRect(viewport);

  const halfWidth = loginScatterClusterHalfWidthPx(sizePx);
  const halfHeight = loginScatterDisplayHeightPx(sizePx) / 2;

  const minX = edgePadding + halfWidth;
  const maxX = viewport.width - edgePadding - halfWidth;
  const minY = edgePadding + halfHeight;
  const maxY = viewport.height - edgePadding - halfHeight;

  if (minX >= maxX || minY >= maxY) {
    return { x: viewport.width / 2, y: edgePadding + halfHeight };
  }

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    const bounds = personaBoundsAt(x, y, sizePx);

    if (rectsOverlap(bounds, exclusion)) {
      continue;
    }

    if (
      options?.avoidCenter &&
      distanceBetween({ x, y }, options.avoidCenter) < minSeparationPx
    ) {
      continue;
    }

    return { x, y };
  }

  const fallbackRegions = [
    { x: minX + (maxX - minX) * 0.2, y: minY + (maxY - minY) * 0.18 },
    { x: minX + (maxX - minX) * 0.8, y: minY + (maxY - minY) * 0.18 },
    { x: minX + (maxX - minX) * 0.2, y: minY + (maxY - minY) * 0.82 },
    { x: minX + (maxX - minX) * 0.8, y: minY + (maxY - minY) * 0.82 },
  ];

  for (const candidate of fallbackRegions) {
    const bounds = personaBoundsAt(candidate.x, candidate.y, sizePx);
    if (!rectsOverlap(bounds, exclusion)) {
      return candidate;
    }
  }

  return { x: minX, y: minY };
}
