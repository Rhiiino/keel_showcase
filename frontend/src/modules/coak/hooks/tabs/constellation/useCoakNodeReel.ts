// keel_web/src/modules/coak/hooks/useCoakNodeReel.ts

import { useFrame } from "@react-three/fiber";
import { useCallback, useRef } from "react";
import { Vector3 } from "three";

import {
  COAK_DRAG_REEL_SMOOTHING,
  COAK_DRAG_REEL_SPEED,
} from "../../../lib/tabs/constellation/coakGraphConstants";
import {
  clampCoakNodePosition,
  coakMinNodeDistanceFromOrigin,
  coakNodeDirectionFromPosition,
  coakNodeDistanceFromOrigin,
  coakNodePositionAtDistance,
  coakWorldAxisUnitVector,
  normalizeCoakWheelDelta,
  type CoakWorldAxis,
} from "../../../lib/tabs/constellation/coakNodePosition";

type UseCoakNodeReelOptions = {
  nodeSphereRadius: number;
  getNodeId: () => string | null;
  isDragging: () => boolean;
  getAxisLock: () => CoakWorldAxis | null;
  getCurrentPosition: () => [number, number, number];
  onPositionChange: (id: string, position: [number, number, number]) => void;
};

export function useCoakNodeReel({
  nodeSphereRadius,
  getNodeId,
  isDragging,
  getAxisLock,
  getCurrentPosition,
  onPositionChange,
}: UseCoakNodeReelOptions) {
  const reelAxisRef = useRef(new Vector3(0, 0, 1));
  const reelTargetDistanceRef = useRef(0);
  const reelDisplayDistanceRef = useRef(0);

  const syncReelFromPosition = useCallback((position: [number, number, number]) => {
    const distance = coakNodeDistanceFromOrigin(position);
    coakNodeDirectionFromPosition(position, reelAxisRef.current);
    reelTargetDistanceRef.current = distance;
    reelDisplayDistanceRef.current = distance;
  }, []);

  const handleReelWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const deltaDistance = normalizeCoakWheelDelta(event) * COAK_DRAG_REEL_SPEED;
    const axisLock = getAxisLock();

    if (axisLock) {
      const nodeId = getNodeId();
      if (!nodeId) {
        return;
      }

      const axisVector = coakWorldAxisUnitVector(axisLock);
      const [x, y, z] = getCurrentPosition();
      onPositionChange(
        nodeId,
        clampCoakNodePosition(
          [
            x + axisVector.x * deltaDistance,
            y + axisVector.y * deltaDistance,
            z + axisVector.z * deltaDistance,
          ],
          nodeSphereRadius,
        ),
      );
      return;
    }

    const minDistance = coakMinNodeDistanceFromOrigin(nodeSphereRadius);
    reelTargetDistanceRef.current = Math.max(
      minDistance,
      reelTargetDistanceRef.current + deltaDistance,
    );
  }, [getAxisLock, getCurrentPosition, getNodeId, nodeSphereRadius, onPositionChange]);

  useFrame((_, delta) => {
    if (!isDragging() || getAxisLock()) {
      return;
    }

    const target = reelTargetDistanceRef.current;
    const current = reelDisplayDistanceRef.current;
    const distanceDelta = target - current;

    if (Math.abs(distanceDelta) < 0.00005) {
      return;
    }

    const blend = 1 - Math.exp(-COAK_DRAG_REEL_SMOOTHING * delta);
    const nextDistance = current + distanceDelta * blend;
    reelDisplayDistanceRef.current = nextDistance;

    const axis = reelAxisRef.current;
    const nodeId = getNodeId();
    if (!nodeId) {
      return;
    }

    onPositionChange(
      nodeId,
      coakNodePositionAtDistance([axis.x, axis.y, axis.z], nextDistance, nodeSphereRadius),
    );
  });

  return {
    syncReelFromPosition,
    handleReelWheel,
  };
}
