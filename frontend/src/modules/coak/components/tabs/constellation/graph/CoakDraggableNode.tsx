// keel_web/src/modules/coak/components/graph/CoakDraggableNode.tsx

import { useCallback, useRef } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import type { Mesh } from "three";

import type { CoakItemKind, CoakTag } from "../../../../api";
import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import { useCoakNodePointerDrag } from "../../../../hooks/tabs/constellation/useCoakNodePointerDrag";
import { isCoakMultiSelectModifier } from "../../../../lib/coakMultiSelect";
import { resolveCoakNodeVisualStyle } from "../../../../lib/tabs/settings/coakNodeVisualSettings";
import { resolveCoakTitleColorHex } from "../../../../lib/tabs/settings/coakTitleColorSettings";
import { CoakAxisDragRail } from "./CoakAxisDragRail";
import { CoakNodeLabel } from "../node-visuals/CoakNodeLabel";
import { CoakRingNodeLabel } from "../node-visuals/CoakRingNodeLabel";
import { CoakNodePinBadge } from "../node-visuals/CoakNodePinBadge";
import { CoakNodeMoveTargetHighlight } from "../node-visuals/CoakNodeMoveTargetHighlight";
import { CoakNodeSphereVisual } from "../node-visuals/CoakNodeSphereVisual";

type CoakDraggableNodeProps = {
  id: string;
  kind: CoakItemKind;
  label?: string;
  tags?: CoakTag[];
  position: [number, number, number];
  radius: number;
  color: string;
  draggable?: boolean;
  isPickTarget?: boolean;
  onPositionChange?: (id: string, position: [number, number, number]) => void;
  onDragActiveChange?: (active: boolean) => void;
  onActivate?: (id: string, options?: { additive?: boolean }) => void;
};

export function CoakDraggableNode({
  id,
  kind,
  label,
  tags = [],
  position,
  radius,
  color,
  draggable = true,
  isPickTarget = false,
  onPositionChange,
  onDragActiveChange,
  onActivate,
}: CoakDraggableNodeProps) {
  const meshRef = useRef<Mesh>(null);
  const onActivateRef = useRef(onActivate);

  const {
    configurationSettings,
    itemEditorNodeIds,
    persistentNodeModalsEnabled,
    openGraphNodeContextMenu,
    resolveNodePosition,
    nodeMoveSession,
    isNodeMoveTarget,
    commitNodeMove,
    closeNodeMove,
    nodeSwapSession,
    isNodeSwapTarget,
    commitNodeSwap,
    closeNodeSwap,
    isNodePinned,
  } = useCoakRecordWorkspace();
  const visualStyle = resolveCoakNodeVisualStyle(configurationSettings, kind);
  const titleColor = resolveCoakTitleColorHex(configurationSettings);
  const pinned = isNodePinned(id);
  const showLabel =
    label != null && itemEditorNodeIds.length === 0 && !persistentNodeModalsEnabled;

  onActivateRef.current = onActivate;

  const { axisLock, beginDragFromMesh } = useCoakNodePointerDrag({
    nodeSphereRadius: radius,
    getNodePosition: resolveNodePosition,
    onPositionChange: (nodeId, next) => onPositionChange?.(nodeId, next),
    onDragActiveChange,
    onClickActivate: (nodeId, options) => onActivateRef.current?.(nodeId, options),
  });

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();

      if (event.button !== 0) {
        return;
      }

      event.nativeEvent.preventDefault();

      if (nodeMoveSession) {
        if (isNodeMoveTarget(id)) {
          void commitNodeMove(id);
        } else {
          closeNodeMove();
        }
        return;
      }

      if (nodeSwapSession) {
        if (isNodeSwapTarget(id)) {
          void commitNodeSwap(id);
        } else {
          closeNodeSwap();
        }
        return;
      }

      if (!draggable) {
        onActivateRef.current?.(id, {
          additive: isCoakMultiSelectModifier(event.nativeEvent),
        });
        return;
      }

      const mesh = meshRef.current;
      if (!mesh) {
        return;
      }

      beginDragFromMesh(id, mesh, event);
    },
    [
      beginDragFromMesh,
      closeNodeMove,
      closeNodeSwap,
      commitNodeMove,
      commitNodeSwap,
      draggable,
      id,
      isNodeMoveTarget,
      isNodeSwapTarget,
      nodeMoveSession,
      nodeSwapSession,
    ],
  );

  const handleContextMenu = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      event.nativeEvent.preventDefault();
      openGraphNodeContextMenu(id, event.clientX, event.clientY);
    },
    [id, openGraphNodeContextMenu],
  );

  return (
    <>
      {axisLock ? <CoakAxisDragRail axis={axisLock} /> : null}
      <group position={position}>
        <CoakNodeSphereVisual
          visualStyle={visualStyle}
          seed={id}
          radius={radius}
          color={color}
          meshRef={meshRef}
          onPointerDown={handlePointerDown}
          onContextMenu={handleContextMenu}
        />
        {isPickTarget ? <CoakNodeMoveTargetHighlight radius={radius} /> : null}
        {showLabel && visualStyle === "ring" ? (
          <CoakRingNodeLabel label={label} radius={radius} color={titleColor} />
        ) : null}
        {showLabel && visualStyle !== "ring" ? (
          <CoakNodeLabel
            label={label}
            radius={radius}
            kind={kind}
            color={titleColor}
            tags={tags}
          />
        ) : null}
        {pinned ? <CoakNodePinBadge radius={radius} /> : null}
      </group>
    </>
  );
}
