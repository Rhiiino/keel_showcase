// keel_web/src/modules/media/components/panels/contextMenu/MediaPanelTileContextMenu.tsx

import { useEffect, useRef, useState } from "react";

import type { MediaPanelItem } from "../../../api";
import { isImageMimeType, isVideoMimeType } from "../../../lib/media";
import { MediaPanelTileColorSwatchRow } from "./MediaPanelTileColorSwatchRow";
import { MediaPanelTileContextMenuIconRow } from "./MediaPanelTileContextMenuIconRow";
import type { PanelTileRect } from "./panelTileRect";
import { PANEL_TILE_CONTEXT_MENU_PANEL_CLASS } from "./MediaPanelTileContextMenuStyles";
import { useMediaPanelTileContextMenuDismiss } from "./useMediaPanelTileContextMenuDismiss";

export type MediaPanelTileContextMenuState = {
  clientX: number;
  clientY: number;
  item: MediaPanelItem;
  tileRect: PanelTileRect;
} | null;

type MediaPanelTileContextMenuProps = {
  menu: MediaPanelTileContextMenuState;
  editMode: boolean;
  onClose: () => void;
  onDelete: (itemId: string) => void;
  onDetails: (itemId: string) => void;
  onView: (item: MediaPanelItem, tileRect: PanelTileRect) => void;
  onSwapStart: (itemId: string) => void;
  onBorderColorChange: (itemId: string, colorHex: string | null) => void;
};

export function MediaPanelTileContextMenu({
  menu,
  editMode,
  onClose,
  onDelete,
  onDetails,
  onView,
  onSwapStart,
  onBorderColorChange,
}: MediaPanelTileContextMenuProps) {
  const menuShellRef = useRef<HTMLDivElement>(null);
  const [localColor, setLocalColor] = useState<string | null>(null);

  const itemId = menu?.item.id ?? null;

  useEffect(() => {
    if (menu) {
      setLocalColor(menu.item.border_color ?? null);
    }
  }, [itemId]);

  useMediaPanelTileContextMenuDismiss(menuShellRef, Boolean(menu), onClose);

  if (!menu) {
    return null;
  }

  const showViewActions = !editMode;
  const canPreviewMedia =
    menu.item.media.status === "ready" &&
    (isImageMimeType(menu.item.media.mime_type) ||
      isVideoMimeType(menu.item.media.mime_type));

  return (
    <div
      ref={menuShellRef}
      className="fixed z-[100] flex items-start"
      style={{ left: menu.clientX, top: menu.clientY }}
    >
      <div
        role="menu"
        aria-label={`Actions for ${menu.item.media.original_filename}`}
        className={PANEL_TILE_CONTEXT_MENU_PANEL_CLASS}
      >
        <MediaPanelTileColorSwatchRow
          currentColorHex={localColor}
          onSelect={(colorHex) => {
            setLocalColor(colorHex);
            onBorderColorChange(menu.item.id, colorHex);
          }}
        />

        <div className="my-1 h-px bg-white/[0.08]" />

        <MediaPanelTileContextMenuIconRow
          item={menu.item}
          tileRect={menu.tileRect}
          showViewActions={showViewActions}
          canPreviewMedia={canPreviewMedia}
          onDelete={onDelete}
          onDetails={onDetails}
          onView={onView}
          onSwapStart={onSwapStart}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
