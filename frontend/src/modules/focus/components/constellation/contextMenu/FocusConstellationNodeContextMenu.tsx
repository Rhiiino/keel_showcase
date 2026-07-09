// src/modules/focus/components/constellation/contextMenu/FocusConstellationNodeContextMenu.tsx

// Right-click context menu for constellation nodes.

import { useEffect, useRef, useState } from "react";

import type { FocusEntryAddMode, FocusNodeStatus } from "../../../lib/focus";
import { FocusConstellationNodeAddFlyout } from "./FocusConstellationNodeAddFlyout";
import { FocusConstellationNodeColorSwatchRow } from "./FocusConstellationNodeColorSwatchRow";
import { FocusConstellationNodeContextMenuIconRow } from "./FocusConstellationNodeContextMenuIconRow";
import { FocusConstellationNodeStatusSubmenu } from "./FocusConstellationNodeStatusSubmenu";
import {
  CONTEXT_MENU_ITEM_CLASS,
  CONTEXT_MENU_PANEL_CLASS,
} from "./FocusConstellationContextMenuStyles";
import { useFocusConstellationContextMenuDismiss } from "./useFocusConstellationContextMenuDismiss";
import { useFocusConstellationSubmenuHover } from "./useFocusConstellationSubmenuHover";
import type { FocusConstellationFlowNode } from "../node";

export type FocusConstellationNodeContextMenuState = {
  clientX: number;
  clientY: number;
  node: FocusConstellationFlowNode;
} | null;

type FocusConstellationNodeContextMenuProps = {
  menu: FocusConstellationNodeContextMenuState;
  onClose: () => void;
  onShow: (node: FocusConstellationFlowNode) => void;
  onCreateTask: (node: FocusConstellationFlowNode, title: string) => Promise<void>;
  onCreateLinkedList: (node: FocusConstellationFlowNode, title: string) => Promise<void>;
  onLinkExistingList: (
    node: FocusConstellationFlowNode,
    listId: number,
    title: string,
  ) => Promise<void>;
  onAddRecord: (node: FocusConstellationFlowNode) => void;
  excludedLinkedListIds: number[];
  addPending?: boolean;
  onView: (node: FocusConstellationFlowNode) => void;
  onOpenScopedConstellation: (node: FocusConstellationFlowNode) => void;
  onAlignChildren: (node: FocusConstellationFlowNode) => void;
  onUnlink: (node: FocusConstellationFlowNode) => void;
  onPromoteToList: (node: FocusConstellationFlowNode) => void;
  onDelete: (node: FocusConstellationFlowNode) => void;
  onStatusChange: (node: FocusConstellationFlowNode, status: FocusNodeStatus) => void;
  onColorChange: (node: FocusConstellationFlowNode, colorHex: string | null) => void;
  showLineage: boolean;
  showAlignChildren: boolean;
  showAdd: boolean;
  showView: boolean;
  showScopedConstellation: boolean;
  showUnlink: boolean;
  showPromoteToList: boolean;
  showDelete: boolean;
  showStatus: boolean;
  showColor: boolean;
  canShow: boolean;
};

export function FocusConstellationNodeContextMenu({
  menu,
  onClose,
  onShow,
  onCreateTask,
  onCreateLinkedList,
  onLinkExistingList,
  onAddRecord,
  excludedLinkedListIds,
  addPending = false,
  onView,
  onOpenScopedConstellation,
  onAlignChildren,
  onUnlink,
  onPromoteToList,
  onDelete,
  onStatusChange,
  onColorChange,
  showLineage,
  showAlignChildren,
  showAdd,
  showView,
  showScopedConstellation,
  showUnlink,
  showPromoteToList,
  showDelete,
  showStatus,
  showColor,
  canShow,
}: FocusConstellationNodeContextMenuProps) {
  const menuShellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const entityId = menu?.node.data.entityId ?? null;
  const [localStatus, setLocalStatus] = useState<FocusNodeStatus | null>(null);
  const [localColor, setLocalColor] = useState<string | null>(null);
  const [addActiveMode, setAddActiveMode] = useState<FocusEntryAddMode | null>(null);

  const parentListId = menu?.node.data.targetContainerId ?? null;

  const resetAddFlyoutState = () => {
    setAddActiveMode(null);
  };

  const {
    open: addFlyoutOpen,
    closeSubmenu: closeAddFlyout,
    openSubmenu: openAddFlyout,
    scheduleClose: scheduleAddFlyoutClose,
  } = useFocusConstellationSubmenuHover({ onClose: resetAddFlyoutState });

  useEffect(() => {
    if (menu) {
      setLocalStatus(menu.node.data.status);
      setLocalColor(menu.node.data.colorHex);
    }
    closeAddFlyout();
    // Reset the optimistic config state whenever the menu targets a new node.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  useEffect(() => {
    if (addActiveMode !== null) {
      openAddFlyout();
    }
  }, [addActiveMode, openAddFlyout]);

  const isAddFlyoutPinned = addActiveMode !== null;
  const handleAddFlyoutMouseLeave = isAddFlyoutPinned
    ? () => undefined
    : scheduleAddFlyoutClose;
  const handleAddIconMouseLeave = isAddFlyoutPinned
    ? () => undefined
    : scheduleAddFlyoutClose;

  useFocusConstellationContextMenuDismiss(menuShellRef, Boolean(menu), onClose);

  if (!menu) {
    return null;
  }

  const showIconRow =
    showDelete ||
    showLineage ||
    showAlignChildren ||
    showView ||
    showScopedConstellation ||
    showUnlink ||
    showAdd;
  const showSelectSection = showStatus || showPromoteToList;
  const canShowAddFlyout = showAdd && parentListId !== null;

  return (
    <div
      ref={menuShellRef}
      className="fixed z-[100] flex items-start"
      style={{ left: menu.clientX, top: menu.clientY }}
    >
      <div
        ref={menuRef}
        role="menu"
        aria-label={`Actions for ${menu.node.data.title}`}
        className={CONTEXT_MENU_PANEL_CLASS}
      >
        {showColor ? (
          <FocusConstellationNodeColorSwatchRow
            currentColorHex={localColor}
            onSelect={(colorHex) => {
              setLocalColor(colorHex);
              onColorChange(menu.node, colorHex);
            }}
          />
        ) : null}
        {showColor && (showIconRow || showSelectSection) ? (
          <div className="my-1 h-px bg-white/[0.08]" />
        ) : null}
        {showIconRow ? (
          <FocusConstellationNodeContextMenuIconRow
            node={menu.node}
            showDelete={showDelete}
            showLineage={showLineage}
            showAlignChildren={showAlignChildren}
            showView={showView}
            showScopedConstellation={showScopedConstellation}
            showUnlink={showUnlink}
            showAdd={showAdd}
            canShow={canShow}
            onDelete={onDelete}
            onShow={onShow}
            onAlignChildren={onAlignChildren}
            onView={onView}
            onOpenScopedConstellation={onOpenScopedConstellation}
            onUnlink={onUnlink}
            onAddMouseEnter={openAddFlyout}
            onAddMouseLeave={handleAddIconMouseLeave}
            onClose={onClose}
          />
        ) : null}
        {showIconRow && showSelectSection ? (
          <div className="my-1 h-px bg-white/[0.08]" />
        ) : null}
        {showStatus ? (
          <FocusConstellationNodeStatusSubmenu
            currentStatus={localStatus ?? menu.node.data.status}
            onSelect={(status) => {
              setLocalStatus(status);
              onStatusChange(menu.node, status);
            }}
          />
        ) : null}
        {showPromoteToList ? (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onPromoteToList(menu.node);
              onClose();
            }}
            className={CONTEXT_MENU_ITEM_CLASS}
          >
            Promote to list
          </button>
        ) : null}
      </div>

      {addFlyoutOpen && canShowAddFlyout ? (
        <FocusConstellationNodeAddFlyout
          node={menu.node}
          parentListId={parentListId}
          excludedLinkedListIds={excludedLinkedListIds}
          activeMode={addActiveMode}
          onActiveModeChange={setAddActiveMode}
          pending={addPending}
          onCreateTask={onCreateTask}
          onCreateLinkedList={onCreateLinkedList}
          onLinkExistingList={onLinkExistingList}
          onAddRecord={onAddRecord}
          onClose={onClose}
          onPinFlyout={openAddFlyout}
          onMouseEnter={openAddFlyout}
          onMouseLeave={handleAddFlyoutMouseLeave}
        />
      ) : null}
    </div>
  );
}
