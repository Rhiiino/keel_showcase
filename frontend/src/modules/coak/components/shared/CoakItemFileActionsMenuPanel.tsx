// keel_web/src/modules/coak/components/shared/CoakItemFileActionsMenuPanel.tsx

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { CARD_MENU_ROOT_ATTR } from "../../../../components/CardMenu";
import {
  COAK_ITEM_FILE_ACTIONS_MENU_WIDTH_PX,
  CoakItemFileActionsMenuItems,
} from "./CoakItemFileActionsMenuItems";

const MENU_GAP_PX = 4;
const VIEWPORT_PADDING_PX = 8;

type MenuPosition = {
  top: number;
  left: number;
};

type CoakItemFileActionsMenuPanelProps = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  disabled?: boolean;
  hasAttachedFile: boolean;
  confirmDeletePending?: boolean;
  onUploadFromDevice: () => void;
  onUploadFromMedia: () => void;
  onRemoveFile?: () => void | boolean;
  onClose: () => void;
  zIndex?: number;
};

export function CoakItemFileActionsMenuPanel({
  open,
  anchorRef,
  disabled = false,
  hasAttachedFile,
  confirmDeletePending = false,
  onUploadFromDevice,
  onUploadFromMedia,
  onRemoveFile,
  onClose,
  zIndex = 120,
}: CoakItemFileActionsMenuPanelProps) {
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    const updateMenuPosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) {
        return;
      }

      const rect = anchor.getBoundingClientRect();
      let left = rect.left;
      left = Math.min(
        left,
        window.innerWidth - COAK_ITEM_FILE_ACTIONS_MENU_WIDTH_PX - VIEWPORT_PADDING_PX,
      );
      left = Math.max(left, VIEWPORT_PADDING_PX);

      setMenuPosition({
        top: rect.bottom + MENU_GAP_PX,
        left,
      });
    };

    updateMenuPosition();

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [anchorRef, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown as never);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown as never);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [anchorRef, onClose, open]);

  if (!open || !menuPosition) {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      {...{ [CARD_MENU_ROOT_ATTR]: "" }}
      style={{
        position: "fixed",
        top: menuPosition.top,
        left: menuPosition.left,
        width: COAK_ITEM_FILE_ACTIONS_MENU_WIDTH_PX,
        zIndex,
      }}
      className="overflow-hidden rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80"
    >
      <CoakItemFileActionsMenuItems
        disabled={disabled}
        hasAttachedFile={hasAttachedFile}
        confirmDeletePending={confirmDeletePending}
        onUploadFromDevice={onUploadFromDevice}
        onUploadFromMedia={onUploadFromMedia}
        onRemoveFile={onRemoveFile}
        onActionComplete={onClose}
      />
    </div>,
    document.body,
  );
}
