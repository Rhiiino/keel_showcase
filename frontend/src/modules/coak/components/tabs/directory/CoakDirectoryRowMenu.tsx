// keel_web/src/modules/coak/components/tabs/directory/CoakDirectoryRowMenu.tsx

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CARD_MENU_ROOT_ATTR } from "../../../../../components/CardMenu";

const MENU_WIDTH_PX = 144;
const SUBMENU_WIDTH_PX = 192;
const MENU_GAP_PX = 4;
const VIEWPORT_PADDING_PX = 8;

const MENU_ITEM_CLASS =
  "flex w-full items-center px-3 py-2 text-left text-xs transition disabled:opacity-50";

type MenuPosition = {
  top: number;
  left: number;
};

type CoakDirectoryRowMenuProps = {
  ariaLabel: string;
  disabled?: boolean;
  showAddMenu?: boolean;
  showFileMenu?: boolean;
  hasAttachedFile?: boolean;
  onAddFolder?: () => void;
  onAddNote?: () => void;
  onAddFlash?: () => void;
  onUploadFromDevice?: () => void;
  onUploadFromMedia?: () => void;
  onRemoveFile?: () => void | boolean;
  fileConfirmPending?: boolean;
  onPromoteToFolder?: () => void;
  onDelete?: () => void | boolean;
  confirmPending?: boolean;
};

function nestedSubmenuPositionClass(flipLeft: boolean): string {
  return flipLeft ? "absolute top-0 right-full pr-0.5" : "absolute top-0 left-full pl-0.5";
}

function FileSubmenu({
  submenuFlipLeft,
  disabled,
  hasAttachedFile,
  onUploadFromDevice,
  onUploadFromMedia,
  onRemoveFile,
  fileConfirmPending,
  closeAndRun,
}: {
  submenuFlipLeft: boolean;
  disabled?: boolean;
  hasAttachedFile: boolean;
  onUploadFromDevice?: () => void;
  onUploadFromMedia?: () => void;
  onRemoveFile?: () => void | boolean;
  fileConfirmPending?: boolean;
  closeAndRun: (action?: () => void) => void;
}) {
  return (
    <div className="group/file relative z-0 cursor-default hover:z-20" aria-haspopup="menu">
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
          style={{ width: SUBMENU_WIDTH_PX }}
        >
          {onUploadFromDevice ? (
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              className={`${MENU_ITEM_CLASS} text-stone-200 hover:bg-stone-900/80`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onUploadFromDevice();
                closeAndRun();
              }}
            >
              Upload from Device
            </button>
          ) : null}
          {onUploadFromMedia ? (
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              className={`${MENU_ITEM_CLASS} text-stone-200 hover:bg-stone-900/80`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                closeAndRun(onUploadFromMedia);
              }}
            >
              Upload from Media
            </button>
          ) : null}
          {hasAttachedFile && onRemoveFile ? (
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              className={`${MENU_ITEM_CLASS} text-red-300 hover:bg-red-950/40`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const keepOpen = onRemoveFile() === false;
                if (!keepOpen) {
                  closeAndRun();
                }
              }}
            >
              {fileConfirmPending ? "Confirm delete" : "Delete"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CoakDirectoryRowMenu({
  ariaLabel,
  disabled = false,
  showAddMenu = false,
  showFileMenu = false,
  hasAttachedFile = false,
  onAddFolder,
  onAddNote,
  onAddFlash,
  onUploadFromDevice,
  onUploadFromMedia,
  onRemoveFile,
  fileConfirmPending = false,
  onPromoteToFolder,
  onDelete,
  confirmPending = false,
}: CoakDirectoryRowMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [submenuFlipLeft, setSubmenuFlipLeft] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasMenuItems =
    showAddMenu || showFileMenu || onPromoteToFolder != null || onDelete != null;

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
      left + MENU_WIDTH_PX + SUBMENU_WIDTH_PX > window.innerWidth - VIEWPORT_PADDING_PX;
    const nestedSubmenuWouldOverflow = left - SUBMENU_WIDTH_PX < VIEWPORT_PADDING_PX;
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

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!hasMenuItems) {
    return null;
  }

  const closeAndRun = (action?: () => void) => {
    setOpen(false);
    action?.();
  };

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
              zIndex: 100,
            }}
            className="overflow-visible rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80"
          >
            {showAddMenu ? (
              <div className="group/add relative z-0 cursor-default hover:z-20" aria-haspopup="menu">
                <div
                  role="menuitem"
                  aria-haspopup="menu"
                  className={`${MENU_ITEM_CLASS} justify-between text-stone-200 group-hover/add:bg-stone-900/80`}
                >
                  <span>Add</span>
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
                    className="pointer-events-none w-[148px] overflow-visible rounded-lg border border-stone-800 bg-stone-950 py-1 opacity-0 shadow-lg ring-1 ring-stone-800/80 transition-opacity group-hover/add:pointer-events-auto group-hover/add:opacity-100"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      disabled={disabled}
                      className={`${MENU_ITEM_CLASS} text-stone-200 hover:bg-stone-900/80`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        closeAndRun(onAddFolder);
                      }}
                    >
                      Folder
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={disabled}
                      className={`${MENU_ITEM_CLASS} text-stone-200 hover:bg-stone-900/80`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        closeAndRun(onAddNote);
                      }}
                    >
                      Note
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={disabled}
                      className={`${MENU_ITEM_CLASS} text-stone-200 hover:bg-stone-900/80`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        closeAndRun(onAddFlash);
                      }}
                    >
                      Flash
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {showFileMenu ? (
              <FileSubmenu
                submenuFlipLeft={submenuFlipLeft}
                disabled={disabled}
                hasAttachedFile={hasAttachedFile}
                onUploadFromDevice={onUploadFromDevice}
                onUploadFromMedia={onUploadFromMedia}
                onRemoveFile={onRemoveFile}
                fileConfirmPending={fileConfirmPending}
                closeAndRun={closeAndRun}
              />
            ) : null}
            {onPromoteToFolder ? (
              <button
                type="button"
                role="menuitem"
                disabled={disabled}
                className={`${MENU_ITEM_CLASS} text-stone-200 hover:bg-stone-900/80`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  closeAndRun(onPromoteToFolder);
                }}
              >
                Promote to folder
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                role="menuitem"
                disabled={disabled}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const keepOpen = onDelete() === false;
                  if (!keepOpen) {
                    setOpen(false);
                  }
                }}
                className={`${MENU_ITEM_CLASS} text-red-300 hover:bg-red-950/40`}
              >
                {confirmPending ? "Confirm delete" : "Delete"}
              </button>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="pointer-events-auto" onClick={(event) => event.stopPropagation()}>
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
          className={[
            "inline-flex h-6 w-6 items-center justify-center rounded-md bg-stone-950/80 text-stone-200 ring-1 ring-stone-700/80 transition",
            disabled
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-stone-900 hover:text-stone-50",
          ].join(" ")}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
            <circle cx="6" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="18" cy="12" r="1.5" />
          </svg>
        </button>
      </div>
      {menu}
    </>
  );
}
