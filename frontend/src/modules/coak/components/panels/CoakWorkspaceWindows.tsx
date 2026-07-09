// keel_web/src/modules/coak/components/panels/CoakWorkspaceWindows.tsx

import { type RefObject } from "react";

import { useCoakRecordWorkspace } from "../../context";
import { useCoakWorkspaceTabDrag } from "../../hooks/panels/useCoakWorkspaceTabDrag";
import { CoakWorkspaceTabDragPreview } from "./CoakWorkspaceTabDragPreview";
import { CoakWorkspaceWindow } from "./CoakWorkspaceWindow";

type CoakWorkspaceWindowsProps = {
  boundsRef: RefObject<HTMLDivElement | null>;
};

export function CoakWorkspaceWindows({ boundsRef }: CoakWorkspaceWindowsProps) {
  const {
    workspaceLayout,
    setWindowRect,
    bringWindowToFront,
    getWindowZIndex,
    setActiveTab,
    moveTabBetweenWindows,
    tearOutTab,
    mergeWindows,
  } = useCoakRecordWorkspace();

  const {
    draggingTabId,
    dragPreview,
    dropIndicator,
    handleTabPointerDown,
    handleTabPointerMove,
    handleTabPointerUp,
    handleTabPointerCancel,
  } = useCoakWorkspaceTabDrag(
    {
      onReorderTab: (windowId, tabId, targetIndex) => {
        moveTabBetweenWindows(tabId, windowId, windowId, targetIndex);
      },
      onMoveTab: moveTabBetweenWindows,
      onTearOutTab: tearOutTab,
    },
    boundsRef,
  );

  return (
    <>
      {workspaceLayout.windows.map((window) => (
        <CoakWorkspaceWindow
          key={window.id}
          window={window}
          boundsRef={boundsRef}
          draggingTabId={draggingTabId}
          dropIndicator={dropIndicator}
          dockTargetWindowId={null}
          onSelectTab={setActiveTab}
          onSetWindowRect={setWindowRect}
          onMergeWindows={mergeWindows}
          bringWindowToFront={bringWindowToFront}
          getWindowZIndex={getWindowZIndex}
          onTabPointerDown={handleTabPointerDown}
          onTabPointerMove={handleTabPointerMove}
          onTabPointerUp={handleTabPointerUp}
          onTabPointerCancel={handleTabPointerCancel}
        />
      ))}
      <CoakWorkspaceTabDragPreview preview={dragPreview} />
    </>
  );
}
