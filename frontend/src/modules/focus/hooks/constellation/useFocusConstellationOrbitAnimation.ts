// keel_web/src/modules/focus/hooks/constellation/useFocusConstellationOrbitAnimation.ts

// Continuous orbit animation around the constellation origin (visual offsets only).

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

import {
  FOCUS_CONSTELLATION_ORBIT_RADIANS_PER_MS,
  orbitTranslateOffsetAroundPivot,
  resolveConstellationOriginPivot,
  settledNodeVisual,
  type NodeVisualState,
} from "../../lib/constellation/animation";
import type { ConstellationLayoutNode } from "../../lib/constellation/graph";
import type { ConstellationPoint } from "../../lib/constellation/layout";

export type ManualOrbitState = {
  pivotNodeId: string;
  pivotPosition: ConstellationPoint;
  descendantIds: ReadonlySet<string>;
};

type UseFocusConstellationOrbitAnimationOptions = {
  layoutNodes: readonly ConstellationLayoutNode[];
  isPlaying: boolean;
  isDragging: boolean;
  manualOrbitRef: RefObject<ManualOrbitState | null>;
};

export function useFocusConstellationOrbitAnimation({
  layoutNodes,
  isPlaying,
  isDragging,
  manualOrbitRef,
}: UseFocusConstellationOrbitAnimationOptions) {
  const angleRadiansRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const [frameTime, setFrameTime] = useState(0);

  const originNodeIds = useMemo(
    () => new Set(layoutNodes.filter((node) => node.isOrigin).map((node) => node.id)),
    [layoutNodes],
  );

  const positionsById = useMemo(
    () => new Map(layoutNodes.map((node) => [node.id, node.position] as const)),
    [layoutNodes],
  );

  const originPivot = useMemo(
    () => resolveConstellationOriginPivot(layoutNodes),
    [layoutNodes],
  );

  const isManualRotating = manualOrbitRef.current !== null;
  const isAnimating = isPlaying && !isDragging && !isManualRotating;

  useEffect(() => {
    if (!isAnimating) {
      lastFrameTimeRef.current = null;
      return;
    }

    let frameId = 0;
    const tick = (now: number) => {
      const last = lastFrameTimeRef.current;
      if (last !== null) {
        const deltaMs = now - last;
        angleRadiansRef.current += deltaMs * FOCUS_CONSTELLATION_ORBIT_RADIANS_PER_MS;
      }
      lastFrameTimeRef.current = now;
      setFrameTime(now);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [isAnimating]);

  const setManualOrbitAngle = useCallback((angleRadians: number) => {
    angleRadiansRef.current = angleRadians;
    setFrameTime(performance.now());
  }, []);

  const getOrbitNodeVisual = useCallback(
    (nodeId: string): NodeVisualState => {
      const manualOrbit = manualOrbitRef.current;
      if (manualOrbit) {
        if (nodeId === manualOrbit.pivotNodeId || !manualOrbit.descendantIds.has(nodeId)) {
          return settledNodeVisual();
        }

        const basePosition = positionsById.get(nodeId);
        if (!basePosition) {
          return settledNodeVisual();
        }

        const offset = orbitTranslateOffsetAroundPivot(
          basePosition,
          manualOrbit.pivotPosition,
          angleRadiansRef.current,
        );
        return {
          visible: true,
          opacity: 1,
          scale: 1,
          translateX: offset.translateX,
          translateY: offset.translateY,
        };
      }

      if (!isPlaying || originNodeIds.has(nodeId)) {
        return settledNodeVisual();
      }

      const basePosition = positionsById.get(nodeId);
      if (!basePosition) {
        return settledNodeVisual();
      }

      const offset = orbitTranslateOffsetAroundPivot(
        basePosition,
        originPivot,
        angleRadiansRef.current,
      );
      return {
        visible: true,
        opacity: 1,
        scale: 1,
        translateX: offset.translateX,
        translateY: offset.translateY,
      };
    },
    [frameTime, isPlaying, manualOrbitRef, originNodeIds, originPivot, positionsById],
  );

  const getOrbitAngleRadians = useCallback(() => angleRadiansRef.current, []);

  const resetOrbitAngle = useCallback(() => {
    angleRadiansRef.current = 0;
    lastFrameTimeRef.current = null;
  }, []);

  return {
    getOrbitNodeVisual,
    frameTime,
    isAnimating,
    isManualRotating,
    getOrbitAngleRadians,
    resetOrbitAngle,
    setManualOrbitAngle,
  };
}
