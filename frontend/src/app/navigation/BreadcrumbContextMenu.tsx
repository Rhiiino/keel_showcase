// keel_web/src/app/navigation/BreadcrumbContextMenu.tsx

// Right-click menu for breadcrumb segments. Item list is data-driven for future actions.

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const MENU_MIN_WIDTH_PX = 144;
const VIEWPORT_PADDING_PX = 8;

export type BreadcrumbContextMenuItem = {
  id: string;
  label: string;
  tone?: "default" | "danger";
  disabled?: boolean;
  onSelect: () => void;
};

type BreadcrumbContextMenuProps = {
  position: { top: number; left: number };
  items: BreadcrumbContextMenuItem[];
  ariaLabel: string;
  onClose: () => void;
};

function clampMenuPosition(
  position: { top: number; left: number },
  menuWidth: number,
  menuHeight: number,
): { top: number; left: number } {
  const maxLeft = window.innerWidth - menuWidth - VIEWPORT_PADDING_PX;
  const maxTop = window.innerHeight - menuHeight - VIEWPORT_PADDING_PX;

  return {
    left: Math.max(VIEWPORT_PADDING_PX, Math.min(position.left, maxLeft)),
    top: Math.max(VIEWPORT_PADDING_PX, Math.min(position.top, maxTop)),
  };
}

export function BreadcrumbContextMenu({
  position,
  items,
  ariaLabel,
  onClose,
}: BreadcrumbContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) {
        return;
      }
      onClose();
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
  }, [onClose]);

  if (items.length === 0) {
    return null;
  }

  const clampedPosition = clampMenuPosition(
    position,
    MENU_MIN_WIDTH_PX,
    items.length * 32 + 8,
  );

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={ariaLabel}
      style={{
        position: "fixed",
        top: clampedPosition.top,
        left: clampedPosition.left,
        minWidth: MENU_MIN_WIDTH_PX,
        zIndex: 200,
      }}
      className="overflow-hidden rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80"
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          className={[
            "flex w-full px-3 py-2 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-50",
            item.tone === "danger"
              ? "text-red-300 hover:bg-red-950/40"
              : "text-stone-200 hover:bg-stone-900/80",
          ].join(" ")}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (item.disabled) {
              return;
            }
            item.onSelect();
            onClose();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
