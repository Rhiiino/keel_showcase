// keel_web/src/modules/focus/hooks/useFocusConstellationWorkOrderBadge.ts

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import type { FocusConstellationNodeShape } from "../lib/focus";
import {
  BADGE_DEFAULT_ANGLE_RADIANS,
  workOrderBadgeOffset,
} from "../lib/constellation/workOrderBadge";

type UseFocusConstellationWorkOrderBadgeParams = {
  workOrder: number | null;
  workOrderBadgeAngle: number | null;
  onWorkOrderChange: (workOrder: number) => void;
  onWorkOrderBadgeAngleChange: (angle: number) => void;
  nodeRef: RefObject<HTMLDivElement | null>;
  visualNodeSize: number;
  shape: FocusConstellationNodeShape;
  setIsNodeHovered: (hovered: boolean) => void;
};

export function useFocusConstellationWorkOrderBadge({
  workOrder,
  workOrderBadgeAngle,
  onWorkOrderChange,
  onWorkOrderBadgeAngleChange,
  nodeRef,
  visualNodeSize,
  shape,
  setIsNodeHovered,
}: UseFocusConstellationWorkOrderBadgeParams) {
  const badgeRef = useRef<HTMLDivElement>(null);
  const currentWorkOrderRef = useRef(workOrder);
  const onWorkOrderChangeRef = useRef(onWorkOrderChange);
  const onWorkOrderBadgeAngleChangeRef = useRef(onWorkOrderBadgeAngleChange);
  const badgeAngleRef = useRef(workOrderBadgeAngle ?? BADGE_DEFAULT_ANGLE_RADIANS);
  const [isBadgeHovered, setIsBadgeHovered] = useState(false);
  const [isBadgeDragging, setIsBadgeDragging] = useState(false);
  const [badgeAngle, setBadgeAngle] = useState(
    () => workOrderBadgeAngle ?? BADGE_DEFAULT_ANGLE_RADIANS,
  );

  const badgeOffset = workOrderBadgeOffset(badgeAngle, visualNodeSize, shape);

  useEffect(() => {
    currentWorkOrderRef.current = workOrder;
  }, [workOrder]);

  useEffect(() => {
    onWorkOrderChangeRef.current = onWorkOrderChange;
  }, [onWorkOrderChange]);

  useEffect(() => {
    onWorkOrderBadgeAngleChangeRef.current = onWorkOrderBadgeAngleChange;
  }, [onWorkOrderBadgeAngleChange]);

  useEffect(() => {
    if (!isBadgeDragging) {
      const nextAngle = workOrderBadgeAngle ?? BADGE_DEFAULT_ANGLE_RADIANS;
      badgeAngleRef.current = nextAngle;
      setBadgeAngle(nextAngle);
    }
  }, [isBadgeDragging, workOrderBadgeAngle]);

  const updateBadgeAngleFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const nodeBounds = nodeRef.current?.getBoundingClientRect();
      if (!nodeBounds) {
        return;
      }
      const nextAngle = Math.atan2(
        clientY - (nodeBounds.top + nodeBounds.height / 2),
        clientX - (nodeBounds.left + nodeBounds.width / 2),
      );
      badgeAngleRef.current = nextAngle;
      setBadgeAngle(nextAngle);
    },
    [nodeRef],
  );

  const commitBadgeAngle = useCallback(() => {
    onWorkOrderBadgeAngleChangeRef.current(badgeAngleRef.current);
  }, []);

  const handleBadgeWheel = useCallback((event: WheelEvent) => {
    if (!badgeRef.current) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node) || !badgeRef.current.contains(target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const currentWorkOrder = currentWorkOrderRef.current;
    if (event.deltaY === 0 || currentWorkOrder === null) {
      return;
    }

    const delta = event.deltaY < 0 ? 1 : -1;
    const nextWorkOrder = Math.max(0, currentWorkOrder + delta);
    currentWorkOrderRef.current = nextWorkOrder;
    onWorkOrderChangeRef.current(nextWorkOrder);
  }, []);

  useEffect(() => {
    if (!isBadgeHovered || workOrder === null) {
      return;
    }

    window.addEventListener("wheel", handleBadgeWheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener("wheel", handleBadgeWheel, { capture: true });
    };
  }, [handleBadgeWheel, isBadgeHovered, workOrder]);

  const handleBadgePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsNodeHovered(false);
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsBadgeDragging(true);
      updateBadgeAngleFromPointer(event.clientX, event.clientY);
    },
    [setIsNodeHovered, updateBadgeAngleFromPointer],
  );

  const handleBadgePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      updateBadgeAngleFromPointer(event.clientX, event.clientY);
    },
    [updateBadgeAngleFromPointer],
  );

  const handleBadgePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsBadgeDragging(false);
      commitBadgeAngle();
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    [commitBadgeAngle],
  );

  const handleBadgePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
      setIsBadgeDragging(false);
      commitBadgeAngle();
    },
    [commitBadgeAngle],
  );

  return {
    badgeRef,
    badgeOffset,
    isBadgeHovered,
    setIsBadgeHovered,
    handleBadgePointerDown,
    handleBadgePointerMove,
    handleBadgePointerUp,
    handleBadgePointerCancel,
  };
}
