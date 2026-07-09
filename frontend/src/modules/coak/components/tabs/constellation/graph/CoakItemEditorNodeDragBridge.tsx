// keel_web/src/modules/coak/components/graph/CoakItemEditorNodeDragBridge.tsx

import { useEffect, useRef } from "react";

import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import { useCoakNodePointerDrag } from "../../../../hooks/tabs/constellation/useCoakNodePointerDrag";
import { CoakAxisDragRail } from "./CoakAxisDragRail";

export function CoakItemEditorNodeDragBridge() {
  const {
    itemEditorNodeDragRequest,
    clearItemEditorNodeDragRequest,
    autoOptimizeLayoutEnabled,
    resolveNodePosition,
    updateNodePosition,
    setConstellationNodeDragActive,
    nodeSphereRadius,
  } = useCoakRecordWorkspace();
  const consumedTokenRef = useRef<number | null>(null);

  const { axisLock, beginDragFromClient } = useCoakNodePointerDrag({
    getNodePosition: resolveNodePosition,
    onPositionChange: updateNodePosition,
    onDragActiveChange: setConstellationNodeDragActive,
    nodeSphereRadius,
  });

  useEffect(() => {
    if (!itemEditorNodeDragRequest || autoOptimizeLayoutEnabled) {
      return;
    }

    if (consumedTokenRef.current === itemEditorNodeDragRequest.token) {
      return;
    }

    consumedTokenRef.current = itemEditorNodeDragRequest.token;
    const { nodeId, pointerId, clientX, clientY } = itemEditorNodeDragRequest;
    beginDragFromClient(nodeId, clientX, clientY, pointerId);
    clearItemEditorNodeDragRequest();
  }, [
    autoOptimizeLayoutEnabled,
    beginDragFromClient,
    clearItemEditorNodeDragRequest,
    itemEditorNodeDragRequest,
  ]);

  return axisLock ? <CoakAxisDragRail axis={axisLock} /> : null;
}
