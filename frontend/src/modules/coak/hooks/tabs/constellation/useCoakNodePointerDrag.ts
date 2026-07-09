// keel_web/src/modules/coak/hooks/graph/useCoakNodePointerDrag.ts

import { useCallback, useEffect, useRef } from "react";
import { type ThreeEvent, useThree } from "@react-three/fiber";
import { Plane, Vector3, type Mesh } from "three";

import { useCoakNodeAxisDrag } from "./useCoakNodeAxisDrag";
import { useCoakNodeReel } from "./useCoakNodeReel";
import { intersectClientWithPlane } from "../../../lib/tabs/constellation/coakNodeDragMath";
import { clampCoakNodePosition } from "../../../lib/tabs/constellation/coakNodePosition";

type UseCoakNodePointerDragOptions = {
  nodeSphereRadius: number;
  getNodePosition: (nodeId: string) => [number, number, number];
  onPositionChange: (nodeId: string, position: [number, number, number]) => void;
  onDragActiveChange?: (active: boolean) => void;
  onClickActivate?: (nodeId: string, options?: { additive?: boolean }) => void;
  activateThresholdPx?: number;
};

const planeNormal = new Vector3();
const intersection = new Vector3();
const nextPosition = new Vector3();
const dragStartWorld = new Vector3();
const pointerDownWorld = new Vector3();
const DEFAULT_ACTIVATE_THRESHOLD_PX = 4;

export function useCoakNodePointerDrag({
  nodeSphereRadius,
  getNodePosition,
  onPositionChange,
  onDragActiveChange,
  onClickActivate,
  activateThresholdPx = DEFAULT_ACTIVATE_THRESHOLD_PX,
}: UseCoakNodePointerDragOptions) {
  const { camera, raycaster, gl } = useThree();

  const draggingRef = useRef(false);
  const draggingNodeIdRef = useRef<string | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const movedRef = useRef(false);
  const pointerDownClientRef = useRef({ x: 0, y: 0 });
  const pointerDownAdditiveRef = useRef(false);
  const dragPlaneRef = useRef<Plane | null>(null);
  const dragOffsetRef = useRef(new Vector3());
  const positionRef = useRef<[number, number, number]>([0, 0, 0]);
  const lastAppliedRef = useRef<[number, number, number] | null>(null);
  const onPositionChangeRef = useRef(onPositionChange);
  const onDragActiveChangeRef = useRef(onDragActiveChange);
  const onClickActivateRef = useRef(onClickActivate);
  const getNodePositionRef = useRef(getNodePosition);

  const {
    axisLock,
    clearAxisLock,
    constrainDragPosition,
    getAxisLock,
    handleAxisKeyDown,
  } = useCoakNodeAxisDrag();

  onPositionChangeRef.current = onPositionChange;
  onDragActiveChangeRef.current = onDragActiveChange;
  onClickActivateRef.current = onClickActivate;
  getNodePositionRef.current = getNodePosition;

  const { syncReelFromPosition, handleReelWheel } = useCoakNodeReel({
    nodeSphereRadius,
    getNodeId: () => draggingNodeIdRef.current,
    isDragging: () => draggingRef.current,
    getAxisLock,
    getCurrentPosition: () => positionRef.current,
    onPositionChange: (nodeId, next) => {
      positionRef.current = next;
      onPositionChangeRef.current?.(nodeId, next);
    },
  });

  const applyDragPosition = useCallback(
    (nodeId: string, next: [number, number, number]) => {
      const last = lastAppliedRef.current;
      if (
        last &&
        last[0] === next[0] &&
        last[1] === next[1] &&
        last[2] === next[2]
      ) {
        return;
      }

      lastAppliedRef.current = next;
      positionRef.current = next;
      onPositionChangeRef.current?.(nodeId, next);
      syncReelFromPosition(next);
    },
    [syncReelFromPosition],
  );

  const updatePositionFromWheel = useCallback(
    (event: WheelEvent) => {
      if (!draggingRef.current) {
        return;
      }
      handleReelWheel(event);
    },
    [handleReelWheel],
  );

  const endDrag = useCallback(() => {
    if (!draggingRef.current) {
      return;
    }

    const nodeId = draggingNodeIdRef.current;
    const shouldActivate = !movedRef.current && nodeId != null;

    draggingRef.current = false;
    draggingNodeIdRef.current = null;
    activePointerIdRef.current = null;
    dragPlaneRef.current = null;
    lastAppliedRef.current = null;
    movedRef.current = false;
    clearAxisLock();
    onDragActiveChangeRef.current?.(false);
    window.removeEventListener("wheel", updatePositionFromWheel);

    if (shouldActivate) {
      onClickActivateRef.current?.(nodeId, {
        additive: pointerDownAdditiveRef.current,
      });
    }
  }, [clearAxisLock, updatePositionFromWheel]);

  const setupDragPlane = useCallback(
    (worldPoint: Vector3) => {
      camera.getWorldDirection(planeNormal);
      planeNormal.negate();

      const dragPlane = dragPlaneRef.current ?? new Plane();
      dragPlane.setFromNormalAndCoplanarPoint(planeNormal, worldPoint);
      dragPlaneRef.current = dragPlane;
    },
    [camera],
  );

  const beginDrag = useCallback(
    (
      nodeId: string,
      pointerId: number,
      grabWorldPoint: Vector3,
      clientX: number,
      clientY: number,
      additive = false,
    ) => {
      draggingRef.current = true;
      draggingNodeIdRef.current = nodeId;
      activePointerIdRef.current = pointerId;
      movedRef.current = false;
      pointerDownClientRef.current = { x: clientX, y: clientY };
      pointerDownAdditiveRef.current = additive;

      const position = getNodePositionRef.current(nodeId);
      positionRef.current = position;
      syncReelFromPosition(position);

      dragStartWorld.set(position[0], position[1], position[2]);
      setupDragPlane(dragStartWorld);
      dragOffsetRef.current.copy(dragStartWorld).sub(grabWorldPoint);

      onDragActiveChangeRef.current?.(true);
      window.addEventListener("wheel", updatePositionFromWheel, { passive: false });
    },
    [setupDragPlane, syncReelFromPosition, updatePositionFromWheel],
  );

  const beginDragFromMesh = useCallback(
    (nodeId: string, _mesh: Mesh, event: ThreeEvent<PointerEvent>) => {
      beginDrag(
        nodeId,
        event.pointerId,
        event.point,
        event.clientX,
        event.clientY,
        event.nativeEvent.metaKey || event.nativeEvent.ctrlKey,
      );
    },
    [beginDrag],
  );

  const beginDragFromClient = useCallback(
    (nodeId: string, clientX: number, clientY: number, pointerId: number) => {
      const position = getNodePositionRef.current(nodeId);
      dragStartWorld.set(position[0], position[1], position[2]);
      setupDragPlane(dragStartWorld);

      const dragPlane = dragPlaneRef.current;
      if (
        !dragPlane ||
        !intersectClientWithPlane(
          clientX,
          clientY,
          dragPlane,
          camera,
          raycaster,
          gl.domElement,
          pointerDownWorld,
        )
      ) {
        return false;
      }

      beginDrag(nodeId, pointerId, pointerDownWorld, clientX, clientY);
      movedRef.current = true;
      return true;
    },
    [beginDrag, camera, gl.domElement, raycaster, setupDragPlane],
  );

  const updateDragFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const dragPlane = dragPlaneRef.current;
      const nodeId = draggingNodeIdRef.current;
      if (!draggingRef.current || !dragPlane || !nodeId) {
        return;
      }

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

      nextPosition.copy(intersection).add(dragOffsetRef.current);
      const constrained = constrainDragPosition(nextPosition);
      applyDragPosition(nodeId, clampCoakNodePosition(constrained, nodeSphereRadius));
    },
    [applyDragPosition, camera, constrainDragPosition, gl.domElement, nodeSphereRadius, raycaster],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) {
        return;
      }

      if (
        activePointerIdRef.current != null &&
        event.pointerId !== activePointerIdRef.current
      ) {
        return;
      }

      const deltaX = event.clientX - pointerDownClientRef.current.x;
      const deltaY = event.clientY - pointerDownClientRef.current.y;
      if (Math.hypot(deltaX, deltaY) > activateThresholdPx) {
        movedRef.current = true;
      }

      updateDragFromClient(event.clientX, event.clientY);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (
        activePointerIdRef.current != null &&
        event.pointerId !== activePointerIdRef.current
      ) {
        return;
      }
      endDrag();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && draggingRef.current) {
        endDrag();
        return;
      }

      if (!draggingRef.current) {
        return;
      }

      handleAxisKeyDown(event, new Vector3(...positionRef.current));
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activateThresholdPx, endDrag, handleAxisKeyDown, updateDragFromClient]);

  return {
    axisLock,
    beginDragFromClient,
    beginDragFromMesh,
    endDrag,
    isDragging: () => draggingRef.current,
  };
}
