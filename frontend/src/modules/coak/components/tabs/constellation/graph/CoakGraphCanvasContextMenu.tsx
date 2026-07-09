// keel_web/src/modules/coak/components/tabs/constellation/graph/CoakGraphCanvasContextMenu.tsx

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import { MENU_ITEM_CLASS } from "./CoakGraphNodeContextMenuIcons";

const MENU_WIDTH_PX = 168;
const VIEWPORT_PADDING_PX = 8;

type MenuPosition = {
  top: number;
  left: number;
};

export const COAK_GRAPH_CANVAS_CONTEXT_MENU_ROOT_ATTR = "data-coak-graph-canvas-context-menu-root";

export function CoakGraphCanvasContextMenu() {
  const {
    graphCanvasContextMenu,
    closeGraphCanvasContextMenu,
    unpinAllNodes,
    pinnedItemIds,
  } = useCoakRecordWorkspace();
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const open = graphCanvasContextMenu != null;
  const hasPinnedNodes = pinnedItemIds.length > 0;

  useLayoutEffect(() => {
    if (!open || !graphCanvasContextMenu) {
      setMenuPosition(null);
      return;
    }

    let left = graphCanvasContextMenu.clientX;
    let top = graphCanvasContextMenu.clientY;

    const menuHeight = menuRef.current?.offsetHeight ?? 40;
    const maxLeft = window.innerWidth - MENU_WIDTH_PX - VIEWPORT_PADDING_PX;
    const maxTop = window.innerHeight - menuHeight - VIEWPORT_PADDING_PX;

    left = Math.min(Math.max(left, VIEWPORT_PADDING_PX), maxLeft);
    top = Math.min(Math.max(top, VIEWPORT_PADDING_PX), maxTop);

    setMenuPosition({ top, left });
  }, [graphCanvasContextMenu, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) {
        return;
      }
      closeGraphCanvasContextMenu();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeGraphCanvasContextMenu();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeGraphCanvasContextMenu, open]);

  if (!open || !menuPosition || !hasPinnedNodes) {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      {...{ [COAK_GRAPH_CANVAS_CONTEXT_MENU_ROOT_ATTR]: "" }}
      style={{
        position: "fixed",
        top: menuPosition.top,
        left: menuPosition.left,
        width: MENU_WIDTH_PX,
        zIndex: 120,
      }}
      className="overflow-visible rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80"
    >
      <button
        type="button"
        role="menuitem"
        className={MENU_ITEM_CLASS}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          unpinAllNodes();
          closeGraphCanvasContextMenu();
        }}
      >
        Unpin all nodes
      </button>
    </div>,
    document.body,
  );
}
