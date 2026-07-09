// keel_web/src/modules/coak/components/tabs/constellation/graph/CoakGraphNodeContextMenu.tsx

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useConfirmDeleteAction } from "../../../../../../hooks/useConfirmDeleteAction";
import { COAK_ORIGIN_NODE_ID, parseCoakItemNodeId } from "../../../../api";
import { useCoakRecordWorkspace } from "../../../../context/CoakRecordWorkspaceContext";
import { useCoakItemFilePicker } from "../../../../hooks/tabs/directory/useCoakItemFilePicker";
import { coakItemSupportsFileAttachment } from "../../../../lib/coakItemKindRegistry";
import { collectCoakDirectChildItemIds } from "../../../../lib/tabs/directory/coakTree";
import { coakNodeHasSiblings } from "../../../../lib/tabs/constellation/coakNodeSwap";
import { CoakGraphNodeContextMenuColorPalette } from "./CoakGraphNodeContextMenuColorPalette";
import {
  CoakGraphNodeContextMenuAddSubmenu,
  COAK_GRAPH_ADD_SUBMENU_WIDTH_PX,
} from "./CoakGraphNodeContextMenuAddSubmenu";
import { CoakGraphNodeContextMenuFileSubmenu } from "./CoakGraphNodeContextMenuFileSubmenu";
import {
  CoakGraphNodeContextMenuRevealSubmenu,
  COAK_GRAPH_REVEAL_SUBMENU_WIDTH_PX,
} from "./CoakGraphNodeContextMenuRevealSubmenu";
import {
  CoakGraphMenuItemContent,
  CoakGraphMenuMinimizeIcon,
  CoakGraphMenuMoveIcon,
  CoakGraphMenuRevolveIcon,
  CoakGraphMenuRotateIcon,
  CoakGraphMenuSwapIcon,
  CoakGraphMenuTrashIcon,
  MENU_ITEM_CLASS,
} from "./CoakGraphNodeContextMenuIcons";
import {
  CoakGraphNodeContextMenuOptimizeSubmenu,
  SUBMENU_WIDTH_PX,
} from "./CoakGraphNodeContextMenuOptimizeSubmenu";
import {
  CoakGraphNodeContextMenuPinSubmenu,
  COAK_GRAPH_PIN_SUBMENU_WIDTH_PX,
} from "./CoakGraphNodeContextMenuPinSubmenu";

const MENU_WIDTH_PX = 168;
const VIEWPORT_PADDING_PX = 8;

type MenuPosition = {
  top: number;
  left: number;
};

export const COAK_GRAPH_NODE_CONTEXT_MENU_ROOT_ATTR = "data-coak-graph-node-context-menu-root";

export function CoakGraphNodeContextMenu() {
  const {
    graphNodeContextMenu,
    closeGraphNodeContextMenu,
    optimizeNodeChildren,
    beginChildRevolve,
    beginNodeRevolve,
    beginNodeMove,
    beginNodeSwap,
    revealNodeChildren,
    revealNodeLineage,
    minimizeNodeChildren,
    autoOptimizeLayoutEnabled,
    items,
    record,
    recolorItem,
    updateRecordColor,
    recordUpdatePending,
    createChildItemAndOpenEditor,
    deleteItem,
    promoteNoteToFolder,
    attachFileToItem,
    attachMediaToItem,
    replaceItemFile,
    replaceItemMedia,
    removeItemFile,
    isLoading,
    isNodePinned,
    pinNode,
    unpinNode,
  } = useCoakRecordWorkspace();
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [submenuFlipLeft, setSubmenuFlipLeft] = useState(false);

  const open = graphNodeContextMenu != null;
  const nodeId = graphNodeContextMenu?.nodeId ?? null;
  const isOrigin = nodeId === COAK_ORIGIN_NODE_ID;
  const sourceItemId = nodeId != null ? parseCoakItemNodeId(nodeId) : null;
  const sourceItem =
    sourceItemId != null ? items.find((item) => item.id === sourceItemId) : null;

  const { confirmPending, containerRef: menuRef, handleClick } =
    useConfirmDeleteAction(nodeId ?? undefined);
  const {
    confirmPending: fileConfirmPending,
    handleClick: handleFileDeleteClick,
  } = useConfirmDeleteAction(
    sourceItemId != null ? `item-file-${sourceItemId}` : undefined,
  );

  const filePicker = useCoakItemFilePicker({
    disabled: isLoading,
    hasAttachedFile: sourceItem?.media_id != null,
    portalDialogs: true,
    mediaPickerZIndexClass: "z-[600]",
    onAttachFile: async (file) => {
      if (sourceItemId != null) {
        await attachFileToItem(sourceItemId, file);
      }
    },
    onAttachMedia: async (media) => {
      if (sourceItemId != null) {
        await attachMediaToItem(sourceItemId, media);
      }
    },
    onReplaceFile: async (file) => {
      if (sourceItemId != null) {
        await replaceItemFile(sourceItemId, file);
      }
    },
    onReplaceMedia: async (media) => {
      if (sourceItemId != null) {
        await replaceItemMedia(sourceItemId, media);
      }
    },
  });

  const hasChildren =
    nodeId != null && collectCoakDirectChildItemIds(items, nodeId).length > 0;
  const canMinimizeChildren =
    hasChildren && (isOrigin || sourceItem?.kind === "folder");
  const hasSiblings =
    sourceItemId != null && coakNodeHasSiblings(items, sourceItemId);
  const movementLocked = autoOptimizeLayoutEnabled;
  const nodeColorHex = isOrigin
    ? (record?.color_hex ?? "#FBBF24")
    : (sourceItem?.color_hex ?? "#FBBF24");
  const colorChangeDisabled =
    recordUpdatePending || (isOrigin ? record == null : sourceItem == null);
  const canAcceptChildren = isOrigin || sourceItem?.kind === "folder";
  const addParentId = isOrigin ? null : (sourceItemId ?? null);
  const addDisabled = isLoading || filePicker.controlsDisabled;
  const showFileMenu =
    !isOrigin && sourceItem != null && coakItemSupportsFileAttachment(sourceItem.kind);
  const nodePinned = nodeId != null && isNodePinned(nodeId);

  useLayoutEffect(() => {
    if (!open || !graphNodeContextMenu) {
      setMenuPosition(null);
      return;
    }

    let left = graphNodeContextMenu.clientX;
    let top = graphNodeContextMenu.clientY;

    left = Math.min(left, window.innerWidth - MENU_WIDTH_PX - VIEWPORT_PADDING_PX);
    left = Math.max(left, VIEWPORT_PADDING_PX);
    top = Math.min(top, window.innerHeight - VIEWPORT_PADDING_PX);
    top = Math.max(top, VIEWPORT_PADDING_PX);

    const submenuWouldOverflow =
      left + MENU_WIDTH_PX + SUBMENU_WIDTH_PX + VIEWPORT_PADDING_PX > window.innerWidth;
    const nestedSubmenuWouldOverflow =
      left + MENU_WIDTH_PX + SUBMENU_WIDTH_PX * 2 + VIEWPORT_PADDING_PX > window.innerWidth;
    const addSubmenuWouldOverflow =
      left + MENU_WIDTH_PX + COAK_GRAPH_ADD_SUBMENU_WIDTH_PX + VIEWPORT_PADDING_PX >
      window.innerWidth;
    const addNestedSubmenuWouldOverflow =
      left + MENU_WIDTH_PX + COAK_GRAPH_ADD_SUBMENU_WIDTH_PX * 2 + VIEWPORT_PADDING_PX >
      window.innerWidth;
    const pinSubmenuWouldOverflow =
      left + MENU_WIDTH_PX + COAK_GRAPH_PIN_SUBMENU_WIDTH_PX + VIEWPORT_PADDING_PX >
      window.innerWidth;
    const revealSubmenuWouldOverflow =
      left + MENU_WIDTH_PX + COAK_GRAPH_REVEAL_SUBMENU_WIDTH_PX + VIEWPORT_PADDING_PX >
      window.innerWidth;
    setSubmenuFlipLeft(
      addNestedSubmenuWouldOverflow ||
        addSubmenuWouldOverflow ||
        nestedSubmenuWouldOverflow ||
        pinSubmenuWouldOverflow ||
        revealSubmenuWouldOverflow ||
        submenuWouldOverflow,
    );

    setMenuPosition({ top, left });
  }, [graphNodeContextMenu, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) {
        return;
      }
      closeGraphNodeContextMenu();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeGraphNodeContextMenu();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeGraphNodeContextMenu, open, menuRef]);

  const handleNodeColorChange = (colorHex: string) => {
    if (isOrigin) {
      void updateRecordColor(colorHex);
      return;
    }
    if (sourceItemId == null) {
      return;
    }
    void recolorItem(sourceItemId, colorHex);
  };

  const handleAddFolder = () => {
    closeGraphNodeContextMenu();
    void createChildItemAndOpenEditor("folder", addParentId);
  };

  const handleAddNote = () => {
    closeGraphNodeContextMenu();
    void createChildItemAndOpenEditor("note", addParentId);
  };

  const handleAddFlash = () => {
    closeGraphNodeContextMenu();
    void createChildItemAndOpenEditor("flash", addParentId);
  };

  const handlePromoteToFolder = () => {
    if (sourceItemId == null) {
      return;
    }
    closeGraphNodeContextMenu();
    void promoteNoteToFolder(sourceItemId);
  };

  const handleRemoveFile = () => {
    if (sourceItemId == null) {
      return;
    }
    handleFileDeleteClick(() => {
      void removeItemFile(sourceItemId);
      closeGraphNodeContextMenu();
    });
  };

  const handleUploadFromDevice = () => {
    filePicker.openUploadFromDevice();
    closeGraphNodeContextMenu();
  };

  const handleUploadFromMedia = () => {
    filePicker.openUploadFromMedia();
    closeGraphNodeContextMenu();
  };

  const menu =
    open && menuPosition && nodeId != null
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            {...{ [COAK_GRAPH_NODE_CONTEXT_MENU_ROOT_ATTR]: "" }}
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              width: MENU_WIDTH_PX,
              zIndex: 120,
            }}
            className="overflow-visible rounded-lg border border-stone-800 bg-stone-950 shadow-lg ring-1 ring-stone-800/80"
          >
            <CoakGraphNodeContextMenuColorPalette
              colorHex={nodeColorHex}
              disabled={colorChangeDisabled}
              onChange={handleNodeColorChange}
            />
            <div className="py-1">
              {canAcceptChildren ? (
                <CoakGraphNodeContextMenuAddSubmenu
                  submenuFlipLeft={submenuFlipLeft}
                  disabled={addDisabled}
                  onAddFolder={handleAddFolder}
                  onAddNote={handleAddNote}
                  onAddFlash={handleAddFlash}
                />
              ) : null}
              {showFileMenu ? (
                <CoakGraphNodeContextMenuFileSubmenu
                  submenuFlipLeft={submenuFlipLeft}
                  disabled={addDisabled}
                  hasAttachedFile={sourceItem?.media_id != null}
                  onUploadFromDevice={handleUploadFromDevice}
                  onUploadFromMedia={handleUploadFromMedia}
                  onRemoveFile={handleRemoveFile}
                  fileConfirmPending={fileConfirmPending}
                />
              ) : null}
              {sourceItem?.kind === "note" && sourceItemId != null ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={isLoading}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handlePromoteToFolder();
                  }}
                  className={MENU_ITEM_CLASS}
                >
                  Promote to folder
                </button>
              ) : null}
              <CoakGraphNodeContextMenuOptimizeSubmenu
                isOrigin={isOrigin}
                nodeId={nodeId}
                hasChildren={hasChildren}
                movementLocked={movementLocked}
                submenuFlipLeft={submenuFlipLeft}
                optimizeNodeChildren={optimizeNodeChildren}
                closeGraphNodeContextMenu={closeGraphNodeContextMenu}
              />
              <button
                type="button"
                role="menuitem"
                disabled={!hasChildren || movementLocked}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  beginChildRevolve(nodeId);
                  closeGraphNodeContextMenu();
                }}
                className={`${MENU_ITEM_CLASS} gap-2`}
              >
                <CoakGraphMenuItemContent icon={<CoakGraphMenuRotateIcon />} label="Rotate" />
              </button>
              {!isOrigin ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    beginNodeRevolve(nodeId);
                    closeGraphNodeContextMenu();
                  }}
                  className={`${MENU_ITEM_CLASS} gap-2`}
                >
                  <CoakGraphMenuItemContent icon={<CoakGraphMenuRevolveIcon />} label="Spin" />
                </button>
              ) : null}
              {!isOrigin ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    beginNodeMove(nodeId);
                    closeGraphNodeContextMenu();
                  }}
                  className={`${MENU_ITEM_CLASS} gap-2`}
                >
                  <CoakGraphMenuItemContent icon={<CoakGraphMenuMoveIcon />} label="Move" />
                </button>
              ) : null}
              {!isOrigin && hasSiblings ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    beginNodeSwap(nodeId);
                    closeGraphNodeContextMenu();
                  }}
                  className={`${MENU_ITEM_CLASS} gap-2`}
                >
                  <CoakGraphMenuItemContent icon={<CoakGraphMenuSwapIcon />} label="Swap" />
                </button>
              ) : null}
              {hasChildren ? (
                <CoakGraphNodeContextMenuRevealSubmenu
                  submenuFlipLeft={submenuFlipLeft}
                  onImmediate={() => {
                    revealNodeChildren(nodeId);
                    closeGraphNodeContextMenu();
                  }}
                  onLineage={() => {
                    revealNodeLineage(nodeId);
                    closeGraphNodeContextMenu();
                  }}
                />
              ) : null}
              {canMinimizeChildren ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    minimizeNodeChildren(nodeId);
                    closeGraphNodeContextMenu();
                  }}
                  className={`${MENU_ITEM_CLASS} gap-2`}
                >
                  <CoakGraphMenuItemContent
                    icon={<CoakGraphMenuMinimizeIcon />}
                    label="Minimize"
                  />
                </button>
              ) : null}
              {!isOrigin || hasChildren ? (
                <CoakGraphNodeContextMenuPinSubmenu
                  submenuFlipLeft={submenuFlipLeft}
                  nodeId={nodeId}
                  isOrigin={isOrigin}
                  hasChildren={hasChildren}
                  nodePinned={nodePinned}
                  items={items}
                  isNodePinned={isNodePinned}
                  pinNode={pinNode}
                  unpinNode={unpinNode}
                  onClose={closeGraphNodeContextMenu}
                />
              ) : null}
              {!isOrigin && sourceItemId != null ? (
                <button
                  type="button"
                  role="menuitem"
                  aria-label={confirmPending ? "Confirm delete" : "Delete"}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleClick(() => {
                      void deleteItem(sourceItemId);
                      closeGraphNodeContextMenu();
                    });
                  }}
                  className={[
                    `${MENU_ITEM_CLASS} gap-2`,
                    confirmPending
                      ? "bg-red-950/50 text-red-200 hover:bg-red-950/70"
                      : "text-red-300 hover:bg-red-950/40",
                  ].join(" ")}
                >
                  <CoakGraphMenuItemContent
                    icon={<CoakGraphMenuTrashIcon />}
                    label={confirmPending ? "Confirm delete" : "Delete"}
                  />
                </button>
              ) : null}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {menu}
      {filePicker.filePickerDialogs}
    </>
  );
}
