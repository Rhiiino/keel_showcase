// keel_web/src/modules/coak/hooks/graph/useCoakNodeAxisDrag.ts

import { useCallback, useRef, useState } from "react";
import { Vector3 } from "three";

import {
  type CoakWorldAxis,
  projectCoakPositionOntoWorldAxis,
} from "../../../lib/tabs/constellation/coakNodePosition";

const constrained = new Vector3();

export function useCoakNodeAxisDrag() {
  const axisLockRef = useRef<CoakWorldAxis | null>(null);
  const axisOriginRef = useRef(new Vector3());
  const [axisLock, setAxisLock] = useState<CoakWorldAxis | null>(null);

  const getAxisLock = useCallback(() => axisLockRef.current, []);

  const clearAxisLock = useCallback(() => {
    axisLockRef.current = null;
    setAxisLock(null);
  }, []);

  const toggleAxisLock = useCallback((axis: CoakWorldAxis, currentPosition: Vector3) => {
    if (axisLockRef.current === axis) {
      axisLockRef.current = null;
      setAxisLock(null);
      return null;
    }

    axisLockRef.current = axis;
    axisOriginRef.current.copy(currentPosition);
    setAxisLock(axis);
    return axis;
  }, []);

  const constrainDragPosition = useCallback(
    (freePosition: Vector3): [number, number, number] => {
      const lockedAxis = axisLockRef.current;
      if (!lockedAxis) {
        return [freePosition.x, freePosition.y, freePosition.z];
      }

      return projectCoakPositionOntoWorldAxis(
        freePosition,
        axisOriginRef.current,
        lockedAxis,
        constrained,
      );
    },
    [],
  );

  const handleAxisKeyDown = useCallback(
    (event: KeyboardEvent, currentPosition: Vector3): boolean => {
      if (event.repeat) {
        return false;
      }

      const key = event.key.toLowerCase();
      if (key !== "x" && key !== "y" && key !== "z") {
        return false;
      }

      event.preventDefault();
      toggleAxisLock(key, currentPosition);
      return true;
    },
    [toggleAxisLock],
  );

  return {
    axisLock,
    axisOriginRef,
    getAxisLock,
    clearAxisLock,
    constrainDragPosition,
    handleAxisKeyDown,
  };
}
