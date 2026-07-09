// keel_web/src/modules/coak/hooks/graph/useCoakChildRevolveDrag.ts

import { useCallback, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Plane, Vector3 } from "three";

import {
  computeCoakRevolveAngleOnPlane,
  normalizeCoakRevolveAngleDelta,
} from "../../../lib/tabs/constellation/coakChildRevolve";
import { intersectClientWithPlane } from "../../../lib/tabs/constellation/coakNodeDragMath";
import type { CoakWorldAxis } from "../../../lib/tabs/constellation/coakNodePosition";

type UseCoakChildRevolveDragOptions = {
  pivot: [number, number, number];
  onRotate: (axis: CoakWorldAxis, deltaAngle: number) => void;
  onDragActiveChange: (active: boolean) => void;
};

const dragPlane = new Plane();
const intersection = new Vector3();
const planeNormal = new Vector3();
const planePoint = new Vector3();

function setRevolveDragPlane(
  pivot: [number, number, number],
  axis: CoakWorldAxis,
  target: Plane,
): void {
  if (axis === "x") {
    planeNormal.set(1, 0, 0);
  } else if (axis === "y") {
    planeNormal.set(0, 1, 0);
  } else {
    planeNormal.set(0, 0, 1);
  }

  planePoint.set(pivot[0], pivot[1], pivot[2]);
  target.setFromNormalAndCoplanarPoint(planeNormal, planePoint);
}

export function useCoakChildRevolveDrag({
  pivot,
  onRotate,
  onDragActiveChange,
}: UseCoakChildRevolveDragOptions) {
  const { camera, raycaster, gl } = useThree();

  const draggingRef = useRef(false);
  const activeAxisRef = useRef<CoakWorldAxis | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const lastAngleRef = useRef(0);
  const onRotateRef = useRef(onRotate);
  const onDragActiveChangeRef = useRef(onDragActiveChange);
  const pivotRef = useRef(pivot);

  onRotateRef.current = onRotate;
  onDragActiveChangeRef.current = onDragActiveChange;
  pivotRef.current = pivot;

  const endDrag = useCallback(() => {
    if (!draggingRef.current) {
      return;
    }

    draggingRef.current = false;
    activeAxisRef.current = null;
    activePointerIdRef.current = null;
    onDragActiveChangeRef.current(false);
  }, []);

  const updateDragFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const axis = activeAxisRef.current;
      if (!axis || !draggingRef.current) {
        return;
      }

      const currentPivot = pivotRef.current;
      setRevolveDragPlane(currentPivot, axis, dragPlane);

      if (
        !intersectClientWithPlane(
          clientX,
          clientY,
          dragPlane,
          camera,
          raycaster,
          gl.domElement,
          intersection,
        )
      ) {
        return;
      }

      const nextAngle = computeCoakRevolveAngleOnPlane(
        intersection.x,
        intersection.y,
        intersection.z,
        currentPivot,
        axis,
      );
      const deltaAngle = normalizeCoakRevolveAngleDelta(nextAngle - lastAngleRef.current);
      lastAngleRef.current = nextAngle;

      if (deltaAngle !== 0) {
        onRotateRef.current(axis, deltaAngle);
      }
    },
    [camera, gl.domElement, raycaster],
  );

  const beginDrag = useCallback(
    (axis: CoakWorldAxis, clientX: number, clientY: number, pointerId: number) => {
      setRevolveDragPlane(pivotRef.current, axis, dragPlane);

      if (
        !intersectClientWithPlane(
          clientX,
          clientY,
          dragPlane,
          camera,
          raycaster,
          gl.domElement,
          intersection,
        )
      ) {
        return;
      }

      draggingRef.current = true;
      activeAxisRef.current = axis;
      activePointerIdRef.current = pointerId;
      lastAngleRef.current = computeCoakRevolveAngleOnPlane(
        intersection.x,
        intersection.y,
        intersection.z,
        pivotRef.current,
        axis,
      );
      onDragActiveChangeRef.current(true);
    },
    [camera, gl.domElement, raycaster],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current || event.pointerId !== activePointerIdRef.current) {
        return;
      }

      event.preventDefault();
      updateDragFromClient(event.clientX, event.clientY);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!draggingRef.current || event.pointerId !== activePointerIdRef.current) {
        return;
      }

      event.preventDefault();
      endDrag();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [endDrag, updateDragFromClient]);

  return { beginDrag };
}
