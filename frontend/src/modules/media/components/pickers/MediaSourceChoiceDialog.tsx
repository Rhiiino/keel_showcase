// keel_web/src/modules/media/components/pickers/MediaSourceChoiceDialog.tsx

// Reusable compact menu for selecting existing media or uploading from device.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MENU_WIDTH_PX = 208;
const VIEWPORT_PADDING_PX = 8;

type MenuPosition = {
  top: number;
  left: number;
};

export type MediaSourceChoiceAnchor = {
  x: number;
  y: number;
};

type MediaSourceChoiceDialogProps = {
  open: boolean;
  title?: string;
  anchor: MediaSourceChoiceAnchor | null;
  disabled?: boolean;
  onSelectFromMedia: () => void;
  onUpload: () => void;
  onCreateFolder?: () => void;
  onClose: () => void;
};

export function MediaSourceChoiceDialog({
  open,
  title = "Media source",
  anchor,
  disabled = false,
  onSelectFromMedia,
  onUpload,
  onCreateFolder,
  onClose,
}: MediaSourceChoiceDialogProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchor) {
      setMenuPosition(null);
      return;
    }

    setMenuPosition({
      top: Math.min(anchor.y, window.innerHeight - VIEWPORT_PADDING_PX),
      left: Math.min(
        Math.max(VIEWPORT_PADDING_PX, anchor.x),
        window.innerWidth - MENU_WIDTH_PX - VIEWPORT_PADDING_PX,
      ),
    });
  }, [anchor, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    menuPosition ? (
      <div
        ref={menuRef}
        role="menu"
        aria-label={title}
        style={{
          position: "fixed",
          top: menuPosition.top,
          left: menuPosition.left,
          width: MENU_WIDTH_PX,
          zIndex: 100,
        }}
        className="overflow-hidden rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80"
      >
        <button
          type="button"
          role="menuitem"
          disabled={disabled}
          onClick={onSelectFromMedia}
          className="flex w-full px-3 py-2 text-left text-sm text-stone-200 transition hover:bg-stone-900/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Select from media
        </button>
        <button
          type="button"
          role="menuitem"
          disabled={disabled}
          onClick={onUpload}
          className="flex w-full px-3 py-2 text-left text-sm text-stone-200 transition hover:bg-stone-900/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Upload
        </button>
        {onCreateFolder ? (
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={onCreateFolder}
            className="flex w-full px-3 py-2 text-left text-sm text-stone-200 transition hover:bg-stone-900/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create folder
          </button>
        ) : null}
      </div>
    ) : null,
    document.body,
  );
}
