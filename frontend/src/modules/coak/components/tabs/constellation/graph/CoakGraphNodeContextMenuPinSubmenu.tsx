// keel_web/src/modules/coak/components/tabs/constellation/graph/CoakGraphNodeContextMenuPinSubmenu.tsx

import { partitionCoakDirectChildNodeIdsByPinState } from "../../../../lib/tabs/constellation/coakNodePinMenu";

const MENU_ITEM_CLASS =
  "flex w-full items-center px-3 py-2 text-left text-xs leading-none text-stone-200 transition hover:bg-stone-900/80 disabled:cursor-not-allowed disabled:opacity-50";

const MENU_ICON_SLOT_CLASS =
  "flex h-3.5 w-3.5 shrink-0 items-center justify-center text-stone-400";

const PIN_SUBMENU_WIDTH_PX = 152;

function CoakGraphMenuPinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M12 17v5M9 3h6l1 7h3l-4 5v2H9v-2L5 10h3l1-7Z"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type CoakGraphNodeContextMenuPinSubmenuProps = {
  submenuFlipLeft: boolean;
  nodeId: string;
  isOrigin: boolean;
  hasChildren: boolean;
  nodePinned: boolean;
  items: Parameters<typeof partitionCoakDirectChildNodeIdsByPinState>[0];
  isNodePinned: (nodeId: string) => boolean;
  pinNode: (nodeId: string) => void;
  unpinNode: (nodeId: string) => void;
  onClose: () => void;
};

export function CoakGraphNodeContextMenuPinSubmenu({
  submenuFlipLeft,
  nodeId,
  isOrigin,
  hasChildren,
  nodePinned,
  items,
  isNodePinned,
  pinNode,
  unpinNode,
  onClose,
}: CoakGraphNodeContextMenuPinSubmenuProps) {
  const { pinnedChildNodeIds, unpinnedChildNodeIds } = hasChildren
    ? partitionCoakDirectChildNodeIdsByPinState(items, nodeId, isNodePinned)
    : { pinnedChildNodeIds: [], unpinnedChildNodeIds: [] };

  const showPinSelf = !isOrigin;
  const showPinChildren = hasChildren && unpinnedChildNodeIds.length > 0;
  const showUnpinChildren = hasChildren && pinnedChildNodeIds.length > 0;

  const handlePinNodes = (nodeIds: string[]) => {
    for (const childNodeId of nodeIds) {
      pinNode(childNodeId);
    }
    onClose();
  };

  const handleUnpinNodes = (nodeIds: string[]) => {
    for (const childNodeId of nodeIds) {
      unpinNode(childNodeId);
    }
    onClose();
  };

  return (
    <div className="group/pin relative z-0 cursor-default hover:z-20" aria-haspopup="menu">
      <div
        role="menuitem"
        aria-haspopup="menu"
        className={`${MENU_ITEM_CLASS} justify-between gap-2 group-hover/pin:bg-stone-900/80`}
      >
        <span className={MENU_ICON_SLOT_CLASS}>
          <CoakGraphMenuPinIcon />
        </span>
        <span className="min-w-0 flex-1">Pin</span>
        <span className="text-[10px] leading-none text-stone-500" aria-hidden>
          ›
        </span>
      </div>
      <div
        className={`absolute top-0 ${
          submenuFlipLeft ? "right-full flex flex-row-reverse pr-0.5" : "left-full pl-0.5"
        }`}
      >
        <div
          role="menu"
          className="pointer-events-none overflow-visible rounded-lg border border-stone-800 bg-stone-950 py-1 opacity-0 shadow-lg ring-1 ring-stone-800/80 transition-opacity group-hover/pin:pointer-events-auto group-hover/pin:opacity-100"
          style={{ width: PIN_SUBMENU_WIDTH_PX }}
        >
          {showPinSelf ? (
            <button
              type="button"
              role="menuitem"
              className={MENU_ITEM_CLASS}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (nodePinned) {
                  unpinNode(nodeId);
                } else {
                  pinNode(nodeId);
                }
                onClose();
              }}
            >
              {nodePinned ? "Unpin self" : "Pin self"}
            </button>
          ) : null}
          {showPinChildren ? (
            <button
              type="button"
              role="menuitem"
              className={MENU_ITEM_CLASS}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handlePinNodes(unpinnedChildNodeIds);
              }}
            >
              Pin children
            </button>
          ) : null}
          {showUnpinChildren ? (
            <button
              type="button"
              role="menuitem"
              className={MENU_ITEM_CLASS}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleUnpinNodes(pinnedChildNodeIds);
              }}
            >
              Unpin children
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const COAK_GRAPH_PIN_SUBMENU_WIDTH_PX = PIN_SUBMENU_WIDTH_PX;
