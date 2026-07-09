// keel_web/src/modules/coak/components/tabs/constellation/graph/CoakGraphCanvasBackdrop.tsx

import { useCallback } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import { BackSide } from "three";

import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import { useCoakConstellationCanvasDismiss } from "../../../../hooks/tabs/constellation/useCoakConstellationCanvasDismiss";

const CANVAS_BACKDROP_RADIUS = 200;

export function CoakGraphCanvasBackdrop() {
  const { openGraphCanvasContextMenu, pinnedItemIds } = useCoakRecordWorkspace();
  const handleCanvasPointerDown = useCoakConstellationCanvasDismiss();

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      handleCanvasPointerDown({
        button: event.button,
        clientX: event.clientX,
        clientY: event.clientY,
      });
    },
    [handleCanvasPointerDown],
  );

  const handleContextMenu = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (pinnedItemIds.length === 0) {
        return;
      }

      event.stopPropagation();
      event.nativeEvent.preventDefault();
      openGraphCanvasContextMenu(event.clientX, event.clientY);
    },
    [openGraphCanvasContextMenu, pinnedItemIds.length],
  );

  return (
    <mesh onPointerDown={handlePointerDown} onContextMenu={handleContextMenu}>
      <sphereGeometry args={[CANVAS_BACKDROP_RADIUS, 24, 24]} />
      <meshBasicMaterial visible={false} side={BackSide} />
    </mesh>
  );
}
