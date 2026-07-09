// keel_web/src/modules/focus/lib/constellation/animation.ts

// Timing and easing for constellation expand / reveal animations.

import type { ConstellationPoint } from "./layout";

export const FOCUS_CONSTELLATION_PUSH_MS = 340;
export const FOCUS_CONSTELLATION_REVEAL_MS = 460;
export const FOCUS_CONSTELLATION_ALIGN_MOVE_MS = 140;

/** One full revolution around the origin in 50 seconds. */
export const FOCUS_CONSTELLATION_ORBIT_PERIOD_MS = 50_000;
export const FOCUS_CONSTELLATION_ORBIT_RADIANS_PER_MS =
  (Math.PI * 2) / FOCUS_CONSTELLATION_ORBIT_PERIOD_MS;

export type NodeVisualState = {
  visible: boolean;
  opacity: number;
  scale: number;
  translateX: number;
  translateY: number;
};

export type EdgeVisualState = {
  visible: boolean;
  drawProgress: number;
  /** When drawProgress shrinks, which path endpoint the stroke recedes into. Default `source`. */
  drawRecedeInto?: "source" | "target";
};

export type WaveDirection = "expand" | "collapse";

export type ExpandWave = {
  direction: WaveDirection;
  expanderId: string;
  startedAt: number;
  pushFrom: ConstellationPoint | null;
  pushTo: ConstellationPoint;
  childIds: string[];
  edgeIds: string[];
};

export function easeOutCubic(progress: number): number {
  const t = Math.min(Math.max(progress, 0), 1);
  return 1 - (1 - t) ** 3;
}

export function settledNodeVisual(): NodeVisualState {
  return {
    visible: true,
    opacity: 1,
    scale: 1,
    translateX: 0,
    translateY: 0,
  };
}

export function settledEdgeVisual(): EdgeVisualState {
  return {
    visible: true,
    drawProgress: 1,
  };
}

export function collapsedHiddenNodeVisual(): NodeVisualState {
  return {
    visible: false,
    opacity: 0,
    scale: 0.35,
    translateX: 0,
    translateY: 0,
  };
}

export function collapsedHiddenEdgeVisual(): EdgeVisualState {
  return {
    visible: false,
    drawProgress: 0,
  };
}

export function rotatePointAroundPivot(
  point: ConstellationPoint,
  pivot: ConstellationPoint,
  radians: number,
): ConstellationPoint {
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: pivot.x + dx * cos - dy * sin,
    y: pivot.y + dx * sin + dy * cos,
  };
}

export function orbitTranslateOffset(
  basePosition: ConstellationPoint,
  radians: number,
  pivot: ConstellationPoint = { x: 0, y: 0 },
): Pick<NodeVisualState, "translateX" | "translateY"> {
  return orbitTranslateOffsetAroundPivot(basePosition, pivot, radians);
}

export function resolveConstellationOriginPivot(
  layoutNodes: readonly { isOrigin: boolean; position: ConstellationPoint }[],
): ConstellationPoint {
  const origin = layoutNodes.find((node) => node.isOrigin);
  return origin?.position ?? { x: 0, y: 0 };
}

export function orbitTranslateOffsetAroundPivot(
  basePosition: ConstellationPoint,
  pivot: ConstellationPoint,
  radians: number,
): Pick<NodeVisualState, "translateX" | "translateY"> {
  const rotated = rotatePointAroundPivot(basePosition, pivot, radians);
  return {
    translateX: rotated.x - basePosition.x,
    translateY: rotated.y - basePosition.y,
  };
}

export function bakeOrbitAngleIntoPositions<
  T extends { isOrigin: boolean; position: ConstellationPoint },
>(
  layoutNodes: readonly T[],
  angleRadians: number,
  positionKeyFor: (node: T) => string,
): Array<{ positionKey: string; position: ConstellationPoint }> {
  if (Math.abs(angleRadians) < 1e-6) {
    return [];
  }

  const pivot = resolveConstellationOriginPivot(layoutNodes);

  return layoutNodes
    .filter((node) => !node.isOrigin)
    .map((node) => ({
      positionKey: positionKeyFor(node),
      position: rotatePointAroundPivot(node.position, pivot, angleRadians),
    }));
}

export function bakeSubtreeOrbitAngleIntoPositions<
  T extends { id: string; position: ConstellationPoint },
>(
  layoutNodes: readonly T[],
  pivotNodeId: string,
  descendantIds: ReadonlySet<string>,
  angleRadians: number,
  positionKeyFor: (node: T) => string,
): Array<{ positionKey: string; position: ConstellationPoint }> {
  if (Math.abs(angleRadians) < 1e-6 || descendantIds.size === 0) {
    return [];
  }

  const pivotNode = layoutNodes.find((node) => node.id === pivotNodeId);
  if (!pivotNode) {
    return [];
  }

  const pivot = pivotNode.position;
  return layoutNodes
    .filter((node) => descendantIds.has(node.id))
    .map((node) => ({
      positionKey: positionKeyFor(node),
      position: rotatePointAroundPivot(node.position, pivot, angleRadians),
    }));
}

export function bakeSubtreeOrbitAngleFromSnapshot(
  pivot: ConstellationPoint,
  angleRadians: number,
  descendantIds: Iterable<string>,
  startPositionsByNodeId: ReadonlyMap<string, ConstellationPoint>,
  positionKeyForNodeId: (nodeId: string) => string | null,
): Array<{ positionKey: string; position: ConstellationPoint }> {
  if (Math.abs(angleRadians) < 1e-6) {
    return [];
  }

  const baked: Array<{ positionKey: string; position: ConstellationPoint }> = [];
  for (const nodeId of descendantIds) {
    const startPosition = startPositionsByNodeId.get(nodeId);
    if (!startPosition) {
      continue;
    }
    const positionKey = positionKeyForNodeId(nodeId);
    if (!positionKey) {
      continue;
    }
    baked.push({
      positionKey,
      position: rotatePointAroundPivot(startPosition, pivot, angleRadians),
    });
  }
  return baked;
}

export function composeNodeVisual(
  expand: NodeVisualState,
  orbit: NodeVisualState,
): NodeVisualState {
  return {
    visible: expand.visible && orbit.visible,
    opacity: expand.opacity * orbit.opacity,
    scale: expand.scale * orbit.scale,
    translateX: expand.translateX + orbit.translateX,
    translateY: expand.translateY + orbit.translateY,
  };
}

export function waveRevealStartMs(wave: ExpandWave): number {
  if (wave.direction === "collapse") {
    return 0;
  }
  return wave.pushFrom ? FOCUS_CONSTELLATION_PUSH_MS : 0;
}

export function waveCollapsePushStartMs(_wave: ExpandWave): number {
  return FOCUS_CONSTELLATION_REVEAL_MS;
}

export function waveTotalDurationMs(wave: ExpandWave): number {
  if (wave.direction === "collapse") {
    return (
      FOCUS_CONSTELLATION_REVEAL_MS + (wave.pushFrom ? FOCUS_CONSTELLATION_PUSH_MS : 0)
    );
  }
  return waveRevealStartMs(wave) + FOCUS_CONSTELLATION_REVEAL_MS;
}

export function isWaveActive(wave: ExpandWave, now: number): boolean {
  return now - wave.startedAt < waveTotalDurationMs(wave);
}

export function resolveNodeVisualState(
  nodeId: string,
  waves: readonly ExpandWave[],
  now: number,
  positionsById: ReadonlyMap<string, ConstellationPoint>,
): NodeVisualState {
  for (const wave of waves) {
    const elapsed = now - wave.startedAt;
    const revealStart = waveRevealStartMs(wave);

    if (nodeId === wave.expanderId && wave.pushFrom) {
      if (wave.direction === "collapse") {
        const pushStart = waveCollapsePushStartMs(wave);
        const expandedOffsetX = wave.pushFrom.x - wave.pushTo.x;
        const expandedOffsetY = wave.pushFrom.y - wave.pushTo.y;
        if (elapsed < pushStart) {
          return {
            visible: true,
            opacity: 1,
            scale: 1,
            translateX: expandedOffsetX,
            translateY: expandedOffsetY,
          };
        }
        const pushElapsed = elapsed - pushStart;
        if (pushElapsed < FOCUS_CONSTELLATION_PUSH_MS) {
          const progress = 1 - easeOutCubic(pushElapsed / FOCUS_CONSTELLATION_PUSH_MS);
          return {
            visible: true,
            opacity: 1,
            scale: 1,
            translateX: expandedOffsetX * (1 - progress),
            translateY: expandedOffsetY * (1 - progress),
          };
        }
        continue;
      }

      if (elapsed < FOCUS_CONSTELLATION_PUSH_MS) {
        const progress = easeOutCubic(elapsed / FOCUS_CONSTELLATION_PUSH_MS);
        return {
          visible: true,
          opacity: 1,
          scale: 1,
          translateX: (wave.pushFrom.x - wave.pushTo.x) * (1 - progress),
          translateY: (wave.pushFrom.y - wave.pushTo.y) * (1 - progress),
        };
      }
      continue;
    }

    if (!wave.childIds.includes(nodeId)) {
      continue;
    }

    const nodePosition = positionsById.get(nodeId);
    const originPosition =
      wave.direction === "collapse" && wave.pushFrom
        ? wave.pushFrom
        : (positionsById.get(wave.expanderId) ?? wave.pushTo);
    if (!nodePosition) {
      continue;
    }

    if (wave.direction === "collapse") {
      const hideElapsed = elapsed - revealStart;
      if (hideElapsed < FOCUS_CONSTELLATION_REVEAL_MS) {
        const progress = 1 - easeOutCubic(hideElapsed / FOCUS_CONSTELLATION_REVEAL_MS);
        return {
          visible: progress > 0.02,
          opacity: progress,
          scale: 0.38 + 0.62 * progress,
          translateX: (originPosition.x - nodePosition.x) * (1 - progress),
          translateY: (originPosition.y - nodePosition.y) * (1 - progress),
        };
      }

      return {
        visible: false,
        opacity: 0,
        scale: 0.35,
        translateX: originPosition.x - nodePosition.x,
        translateY: originPosition.y - nodePosition.y,
      };
    }

    if (elapsed < revealStart) {
      return {
        visible: false,
        opacity: 0,
        scale: 0.35,
        translateX: originPosition.x - nodePosition.x,
        translateY: originPosition.y - nodePosition.y,
      };
    }

    const revealElapsed = elapsed - revealStart;
    if (revealElapsed < FOCUS_CONSTELLATION_REVEAL_MS) {
      const progress = easeOutCubic(revealElapsed / FOCUS_CONSTELLATION_REVEAL_MS);
      return {
        visible: true,
        opacity: progress,
        scale: 0.38 + 0.62 * progress,
        translateX: (originPosition.x - nodePosition.x) * (1 - progress),
        translateY: (originPosition.y - nodePosition.y) * (1 - progress),
      };
    }
  }

  return settledNodeVisual();
}

export function resolveEdgeVisualState(
  edgeId: string,
  waves: readonly ExpandWave[],
  now: number,
): EdgeVisualState {
  for (const wave of waves) {
    if (!wave.edgeIds.includes(edgeId)) {
      continue;
    }

    const elapsed = now - wave.startedAt;
    const revealStart = waveRevealStartMs(wave);

    if (wave.direction === "collapse") {
      const hideElapsed = elapsed - revealStart;
      if (hideElapsed < FOCUS_CONSTELLATION_REVEAL_MS) {
        const progress = 1 - easeOutCubic(hideElapsed / FOCUS_CONSTELLATION_REVEAL_MS);
        return {
          visible: progress > 0.02,
          drawProgress: progress,
        };
      }
      return { visible: false, drawProgress: 0 };
    }

    if (elapsed < revealStart) {
      return { visible: false, drawProgress: 0 };
    }

    const revealElapsed = elapsed - revealStart;
    if (revealElapsed < FOCUS_CONSTELLATION_REVEAL_MS) {
      return {
        visible: true,
        drawProgress: easeOutCubic(revealElapsed / FOCUS_CONSTELLATION_REVEAL_MS),
      };
    }
  }

  return settledEdgeVisual();
}



// ----- Unlink animation
export type UnlinkWave = {
  startedAt: number;
  parentId: string;
  detachedNodeId: string;
  appearingNodeId: string | null;
  edgeId: string;
};

export const FOCUS_CONSTELLATION_UNLINK_BREAK_MS = FOCUS_CONSTELLATION_REVEAL_MS;

export function unlinkWaveTotalDurationMs(_wave: UnlinkWave): number {
  return FOCUS_CONSTELLATION_UNLINK_BREAK_MS;
}

export function isUnlinkWaveActive(wave: UnlinkWave, now: number): boolean {
  return now - wave.startedAt < unlinkWaveTotalDurationMs(wave);
}

export function resolveUnlinkEdgeVisual(
  edgeId: string,
  waves: readonly UnlinkWave[],
  now: number,
): EdgeVisualState | null {
  for (const wave of waves) {
    if (wave.edgeId !== edgeId) {
      continue;
    }

    const elapsed = now - wave.startedAt;
    if (elapsed < FOCUS_CONSTELLATION_UNLINK_BREAK_MS) {
      const progress = 1 - easeOutCubic(elapsed / FOCUS_CONSTELLATION_UNLINK_BREAK_MS);
      return {
        visible: progress > 0.02,
        drawProgress: progress,
        drawRecedeInto: "target",
      };
    }

    return { visible: false, drawProgress: 0 };
  }

  return null;
}

export function resolveUnlinkNodeVisual(
  nodeId: string,
  waves: readonly UnlinkWave[],
): NodeVisualState | null {
  for (const wave of waves) {
    if (nodeId === wave.detachedNodeId) {
      // The unlinked node never moves. It stays exactly where it is (wherever
      // the cursor is dragging it, or where it was released) while the edge
      // recedes into it; only the connection animates.
      return settledNodeVisual();
    }

    if (wave.appearingNodeId && nodeId === wave.appearingNodeId) {
      // The standalone replacement node stays hidden for the whole wave. On
      // promotion it is inserted at the detached node's live position, so the
      // swap is seamless with no reveal motion from the parent.
      return {
        visible: false,
        opacity: 0,
        scale: 1,
        translateX: 0,
        translateY: 0,
      };
    }
  }

  return null;
}



// ----- Child alignment animation
export type AlignSubtreeMove = {
  nodeIds: string[];
  fromByNodeId: ReadonlyMap<string, ConstellationPoint>;
  toByNodeId: ReadonlyMap<string, ConstellationPoint>;
  startedAt: number;
};

export function resolveAlignNodeVisualOffset(
  nodeId: string,
  move: AlignSubtreeMove | null,
  now: number,
): Pick<NodeVisualState, "translateX" | "translateY"> {
  if (!move || !move.nodeIds.includes(nodeId)) {
    return { translateX: 0, translateY: 0 };
  }

  const from = move.fromByNodeId.get(nodeId);
  const to = move.toByNodeId.get(nodeId);
  if (!from || !to) {
    return { translateX: 0, translateY: 0 };
  }

  const elapsed = now - move.startedAt;
  const progress =
    elapsed >= FOCUS_CONSTELLATION_ALIGN_MOVE_MS
      ? 1
      : easeOutCubic(elapsed / FOCUS_CONSTELLATION_ALIGN_MOVE_MS);

  return {
    translateX: (to.x - from.x) * progress,
    translateY: (to.y - from.y) * progress,
  };
}
