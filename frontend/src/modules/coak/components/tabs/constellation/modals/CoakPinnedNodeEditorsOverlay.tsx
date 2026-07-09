// keel_web/src/modules/coak/components/tabs/constellation/modals/CoakPinnedNodeEditorsOverlay.tsx

import { useEffect, useMemo, useRef } from "react";

import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import {
  COAK_PINNED_MODAL_UNPIN_BADGE_TOP_OVERFLOW,
  COAK_PINNED_PANEL_HORIZONTAL_PADDING,
  COAK_PINNED_PANEL_WIDTH,
  filterVisibleCoakPinnedNodeIds,
  queryCoakPinnedPanelFrame,
  scrollCoakPinnedPanelFrameToCenter,
} from "./coakPinnedItemEditorLayout";
import { CoakPinnedItemEditorFrame } from "./CoakPinnedItemEditorFrame";

export function CoakPinnedNodeEditorsOverlay() {
  const { pinnedNodeIds, items, selectedNodeId, isNodePinned, itemEditorNodeIds } =
    useCoakRecordWorkspace();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const visiblePinnedNodeIds = useMemo(() => {
    const floatingEditorIds = new Set(itemEditorNodeIds);
    return filterVisibleCoakPinnedNodeIds(pinnedNodeIds, items).filter(
      (nodeId) => !floatingEditorIds.has(nodeId),
    );
  }, [itemEditorNodeIds, items, pinnedNodeIds]);

  useEffect(() => {
    if (
      selectedNodeId == null ||
      !isNodePinned(selectedNodeId) ||
      !visiblePinnedNodeIds.includes(selectedNodeId)
    ) {
      return;
    }

    const scrollSelectedIntoView = () => {
      const container = scrollContainerRef.current;
      if (!container) {
        return;
      }

      const frame = queryCoakPinnedPanelFrame(container, selectedNodeId);
      if (!frame) {
        return;
      }

      scrollCoakPinnedPanelFrameToCenter(container, frame);
    };

    scrollSelectedIntoView();
    const animationFrame = requestAnimationFrame(scrollSelectedIntoView);

    return () => cancelAnimationFrame(animationFrame);
  }, [isNodePinned, selectedNodeId, visiblePinnedNodeIds]);

  if (visiblePinnedNodeIds.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 z-[14] flex flex-col overflow-x-hidden border-r border-stone-800/50 bg-stone-950/35 backdrop-blur-[2px]"
      style={{ width: COAK_PINNED_PANEL_WIDTH }}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        ref={scrollContainerRef}
        className="pointer-events-auto flex min-h-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto scrollbar-hidden pb-3"
        style={{
          paddingInline: COAK_PINNED_PANEL_HORIZONTAL_PADDING,
          paddingTop: COAK_PINNED_MODAL_UNPIN_BADGE_TOP_OVERFLOW,
        }}
      >
        {visiblePinnedNodeIds.map((nodeId) => (
          <CoakPinnedItemEditorFrame key={nodeId} nodeId={nodeId} />
        ))}
      </div>
    </div>
  );
}
