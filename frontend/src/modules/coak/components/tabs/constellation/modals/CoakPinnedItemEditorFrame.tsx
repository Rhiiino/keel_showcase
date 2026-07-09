// keel_web/src/modules/coak/components/tabs/constellation/modals/CoakPinnedItemEditorFrame.tsx

import { useEffect, useState, type FocusEvent } from "react";

import { parseCoakItemNodeId } from "../../../../api";
import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import {
  COAK_ITEM_EDITOR_STACK_BASE_Z_INDEX,
  COAK_ITEM_EDITOR_STACK_HOVER_Z_INDEX,
} from "../../../../lib/tabs/constellation/coakItemEditorAnchor";
import { isCoakItemEditorInteractiveTarget } from "../../../../lib/tabs/constellation/coakItemEditorDrag";
import { COAK_PINNED_ITEM_EDITOR_WIDTH } from "./coakPinnedItemEditorLayout";
import { CoakItemEditorModal } from "./CoakItemEditorModal";
import { CoakPinnedModalUnpinBadge } from "./CoakPinnedModalUnpinBadge";

type CoakPinnedItemEditorFrameProps = {
  nodeId: string;
};

export function CoakPinnedItemEditorFrame({ nodeId }: CoakPinnedItemEditorFrameProps) {
  const { items, unpinNode } = useCoakRecordWorkspace();
  const [frameOpen, setFrameOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const itemId = parseCoakItemNodeId(nodeId);
  const item = itemId != null ? items.find((entry) => entry.id === itemId) : null;

  useEffect(() => {
    if (item) {
      setFrameOpen(true);
    } else {
      setFrameOpen(false);
    }
  }, [item]);

  if (!item) {
    return null;
  }

  const isElevated = isHovered || isEditing;

  const handleFocusCapture = (event: FocusEvent<HTMLDivElement>) => {
    if (isCoakItemEditorInteractiveTarget(event.target)) {
      setIsEditing(true);
    }
  };

  const handleBlurCapture = (event: FocusEvent<HTMLDivElement>) => {
    const relatedTarget = event.relatedTarget;
    if (
      relatedTarget instanceof Node &&
      event.currentTarget.contains(relatedTarget) &&
      isCoakItemEditorInteractiveTarget(relatedTarget)
    ) {
      return;
    }

    setIsEditing(false);
  };

  return (
    <div
      data-coak-pinned-node-id={nodeId}
      className="pointer-events-auto relative shrink-0"
      style={{
        width: COAK_PINNED_ITEM_EDITOR_WIDTH,
        zIndex: isElevated
          ? COAK_ITEM_EDITOR_STACK_HOVER_Z_INDEX
          : COAK_ITEM_EDITOR_STACK_BASE_Z_INDEX,
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      <CoakItemEditorModal nodeId={nodeId} open={frameOpen} portalFilePickerDialogs />
      <CoakPinnedModalUnpinBadge onUnpin={() => unpinNode(nodeId)} />
    </div>
  );
}
