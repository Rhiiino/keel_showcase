// keel_web/src/modules/coak/hooks/tabs/constellation/useCoakConstellationCanvasDismiss.ts

import { useCallback, useEffect, useRef } from "react";

import { useCoakRecordWorkspace } from "../../../context/CoakRecordWorkspaceContext";
import { COAK_CHILD_REVOLVE_DISMISS_THRESHOLD_PX } from "../../../lib/tabs/constellation/coakGraphConstants";
import { useCoakChildRevolveDismiss } from "./useCoakChildRevolveDismiss";
import { useCoakGraphPickModeDismiss } from "./useCoakGraphPickModeDismiss";

type CanvasDismissEvent = {
  button: number;
  clientX: number;
  clientY: number;
};

export function useCoakConstellationCanvasDismiss() {
  const {
    closeItemEditor,
    closeGraphNodeContextMenu,
    closeGraphCanvasContextMenu,
    preserveConstellationSelection,
    childRevolveSession,
    childRevolveDragActive,
    closeChildRevolve,
    nodeRevolveSession,
    closeNodeRevolve,
    nodeMoveSession,
    closeNodeMove,
    nodeSwapSession,
    closeNodeSwap,
  } = useCoakRecordWorkspace();

  const pendingEditorDismissRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const closeEditorsRef = useRef(() => {
    closeItemEditor();
    closeGraphNodeContextMenu();
    closeGraphCanvasContextMenu();
  });

  closeEditorsRef.current = () => {
    closeItemEditor();
    closeGraphNodeContextMenu();
    closeGraphCanvasContextMenu();
  };

  const { handlePointerMissed: handleChildRevolvePointerMissed } = useCoakChildRevolveDismiss({
    active: childRevolveSession != null,
    dragActive: childRevolveDragActive,
    onDismiss: closeChildRevolve,
  });

  const { handlePointerMissed: handleNodeRevolvePointerMissed } = useCoakChildRevolveDismiss({
    active: nodeRevolveSession != null,
    dragActive: false,
    onDismiss: closeNodeRevolve,
  });

  const { handlePointerMissed: handleNodeMovePointerMissed } = useCoakGraphPickModeDismiss({
    active: nodeMoveSession != null,
    onDismiss: closeNodeMove,
  });

  const { handlePointerMissed: handleNodeSwapPointerMissed } = useCoakGraphPickModeDismiss({
    active: nodeSwapSession != null,
    onDismiss: closeNodeSwap,
  });

  const handleCanvasPointerDown = useCallback(
    (event: CanvasDismissEvent) => {
      handleChildRevolvePointerMissed(event);
      handleNodeRevolvePointerMissed(event);
      handleNodeMovePointerMissed(event);
      handleNodeSwapPointerMissed(event);

      if (
        event.button !== 0 ||
        preserveConstellationSelection ||
        nodeMoveSession != null ||
        nodeSwapSession != null
      ) {
        return;
      }

      pendingEditorDismissRef.current = true;
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
    },
    [
      handleChildRevolvePointerMissed,
      handleNodeRevolvePointerMissed,
      handleNodeMovePointerMissed,
      handleNodeSwapPointerMissed,
      nodeMoveSession,
      nodeSwapSession,
      preserveConstellationSelection,
    ],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!pendingEditorDismissRef.current) {
        return;
      }

      const dx = event.clientX - pointerStartRef.current.x;
      const dy = event.clientY - pointerStartRef.current.y;
      if (Math.hypot(dx, dy) > COAK_CHILD_REVOLVE_DISMISS_THRESHOLD_PX) {
        pendingEditorDismissRef.current = false;
      }
    };

    const handlePointerUp = () => {
      if (pendingEditorDismissRef.current) {
        closeEditorsRef.current();
      }

      pendingEditorDismissRef.current = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

  return handleCanvasPointerDown;
}
