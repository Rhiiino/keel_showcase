// keel_web/src/modules/coak/components/shared/CoakItemFileMenu.tsx

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CARD_MENU_ROOT_ATTR } from "../../../../components/CardMenu";
import {
  COAK_ITEM_FILE_ACTIONS_MENU_WIDTH_PX,
  CoakItemFileActionsMenuItems,
} from "./CoakItemFileActionsMenuItems";

const MENU_WIDTH_PX = 144;
const MENU_GAP_PX = 4;
const VIEWPORT_PADDING_PX = 8;

const MENU_ITEM_CLASS =
  "flex w-full items-center px-3 py-2 text-left text-xs transition disabled:opacity-50";

type MenuPosition = {
  top: number;
  left: number;
};

type CoakItemFileMenuProps = {
  ariaLabel: string;
  disabled?: boolean;
  hasAttachedFile: boolean;
  onUploadFromDevice: () => void;
  onUploadFromMedia: () => void;
  onRemoveFile?: () => void | boolean;
  confirmDeletePending?: boolean;
  buttonClassName?: string;
};

function nestedSubmenuPositionClass(flipLeft: boolean): string {
  return flipLeft ? "absolute top-0 right-full pr-0.5" : "absolute top-0 left-full pl-0.5";
}

export function CoakItemFileMenu({
  ariaLabel,
  disabled = false,
  hasAttachedFile,
  onUploadFromDevice,
  onUploadFromMedia,
  onRemoveFile,
  confirmDeletePending = false,
  buttonClassName,
}: CoakItemFileMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [submenuFlipLeft, setSubmenuFlipLeft] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function updateMenuPosition() {
    const button = buttonRef.current;
    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    let left = rect.right - MENU_WIDTH_PX;
    if (left < VIEWPORT_PADDING_PX) {
      left = rect.left;
    }
    left = Math.min(left, window.innerWidth - MENU_WIDTH_PX - VIEWPORT_PADDING_PX);

    const submenuWouldOverflow =
      left + MENU_WIDTH_PX + COAK_ITEM_FILE_ACTIONS_MENU_WIDTH_PX >
      window.innerWidth - VIEWPORT_PADDING_PX;
    const nestedSubmenuWouldOverflow =
      left - COAK_ITEM_FILE_ACTIONS_MENU_WIDTH_PX < VIEWPORT_PADDING_PX;
    setSubmenuFlipLeft(nestedSubmenuWouldOverflow || submenuWouldOverflow);

    setMenuPosition({
      top: rect.bottom + MENU_GAP_PX,
      left,
    });
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown as never);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown as never);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const menu =
    open && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            {...{ [CARD_MENU_ROOT_ATTR]: "" }}
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              width: MENU_WIDTH_PX,
              zIndex: 120,
            }}
            className="overflow-visible rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80"
          >
            <div className="group/file relative cursor-default" aria-haspopup="menu">
              <div
                role="menuitem"
                aria-haspopup="menu"
                className={`${MENU_ITEM_CLASS} justify-between text-stone-200 group-hover/file:bg-stone-900/80`}
              >
                <span>File</span>
                <span className="text-[10px] leading-none text-stone-500" aria-hidden>
                  ›
                </span>
              </div>
              <div className={nestedSubmenuPositionClass(submenuFlipLeft)}>
                <div
                  role="menu"
                  className="pointer-events-none rounded-lg border border-stone-800 bg-stone-950 py-1 opacity-0 shadow-lg ring-1 ring-stone-800/80 transition-opacity group-hover/file:pointer-events-auto group-hover/file:opacity-100"
                  style={{ width: COAK_ITEM_FILE_ACTIONS_MENU_WIDTH_PX }}
                >
                  <CoakItemFileActionsMenuItems
                    disabled={disabled}
                    hasAttachedFile={hasAttachedFile}
                    confirmDeletePending={confirmDeletePending}
                    onUploadFromDevice={onUploadFromDevice}
                    onUploadFromMedia={onUploadFromMedia}
                    onRemoveFile={onRemoveFile}
                    onActionComplete={() => setOpen(false)}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        className={
          buttonClassName ??
          "inline-flex h-6 w-6 items-center justify-center rounded-md bg-stone-950/80 text-stone-200 ring-1 ring-stone-700/80 transition hover:bg-stone-900 hover:text-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <circle cx="6" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="18" cy="12" r="1.5" />
        </svg>
      </button>
      {menu}
    </>
  );
}
