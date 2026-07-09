// keel_web/src/lib/keelPersona/gazeTransition.ts

export type KeelGazeEyePosition = {
  xPct: number;
  yPct: number;
  sizePx: number;
  color: string;
};

export type KeelGazeGroupPositions = {
  left: KeelGazeEyePosition;
  right: KeelGazeEyePosition;
};

export const KEEL_GAZE_GROUP_POSITIONS: Record<string, KeelGazeGroupPositions> = {
  "gaze-straight": {
    left: { xPct: 31.8, yPct: 31.7, sizePx: 22, color: "hsl(178, 70%, 55%)" },
    right: { xPct: 68.2, yPct: 31.8, sizePx: 22, color: "hsl(172, 70%, 55%)" },
  },
  "gaze-bottom-left": {
    left: { xPct: 24.5, yPct: 41.5, sizePx: 22, color: "hsl(178, 70%, 55%)" },
    right: { xPct: 64.5, yPct: 40.4, sizePx: 22, color: "hsl(172, 70%, 55%)" },
  },
  "gaze-bottom-right": {
    left: { xPct: 36.6, yPct: 39.1, sizePx: 22, color: "hsl(178, 70%, 55%)" },
    right: { xPct: 76.2, yPct: 41.1, sizePx: 22, color: "hsl(172, 70%, 55%)" },
  },
  "gaze-top-left": {
    left: { xPct: 29.1, yPct: 23.5, sizePx: 22, color: "hsl(178, 70%, 55%)" },
    right: { xPct: 60.6, yPct: 23.4, sizePx: 22, color: "hsl(172, 70%, 55%)" },
  },
  "gaze-top-right": {
    left: { xPct: 39, yPct: 22.7, sizePx: 22, color: "hsl(178, 70%, 55%)" },
    right: { xPct: 71, yPct: 22.3, sizePx: 22, color: "hsl(172, 70%, 55%)" },
  },
};

export const KEEL_GAZE_GROUP_IDS = [
  "gaze-straight",
  "gaze-bottom-left",
  "gaze-bottom-right",
  "gaze-top-left",
  "gaze-top-right",
] as const;

export function extractGazeGroupId(visibleGroupIds: readonly string[]): string | null {
  for (const groupId of KEEL_GAZE_GROUP_IDS) {
    if (visibleGroupIds.includes(groupId)) {
      return groupId;
    }
  }
  return null;
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function easeInOut(progress: number): number {
  return progress < 0.5
    ? 2 * progress * progress
    : 1 - ((-2 * progress + 2) ** 2) / 2;
}

export function blendGazePositions(
  fromGroupId: string,
  toGroupId: string,
  rawProgress: number,
): KeelGazeGroupPositions {
  const from = KEEL_GAZE_GROUP_POSITIONS[fromGroupId];
  const to = KEEL_GAZE_GROUP_POSITIONS[toGroupId];
  const progress = easeInOut(Math.max(0, Math.min(1, rawProgress)));

  return {
    left: {
      xPct: lerp(from.left.xPct, to.left.xPct, progress),
      yPct: lerp(from.left.yPct, to.left.yPct, progress),
      sizePx: lerp(from.left.sizePx, to.left.sizePx, progress),
      color: progress < 0.5 ? from.left.color : to.left.color,
    },
    right: {
      xPct: lerp(from.right.xPct, to.right.xPct, progress),
      yPct: lerp(from.right.yPct, to.right.yPct, progress),
      sizePx: lerp(from.right.sizePx, to.right.sizePx, progress),
      color: progress < 0.5 ? from.right.color : to.right.color,
    },
  };
}

export const KEEL_GAZE_TRANSITION_DURATION_MS = 250;

export function resolveGazeTravelDirection(
  fromGroupId: string,
  toGroupId: string,
): "left" | "right" {
  const from = KEEL_GAZE_GROUP_POSITIONS[fromGroupId];
  const to = KEEL_GAZE_GROUP_POSITIONS[toGroupId];
  const fromCenterX = (from.left.xPct + from.right.xPct) / 2;
  const toCenterX = (to.left.xPct + to.right.xPct) / 2;
  return toCenterX >= fromCenterX ? "right" : "left";
}
