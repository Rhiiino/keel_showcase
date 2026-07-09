// stack_sandbox/frontend_web/src/modules/auth/components/ProfileMenu.tsx

// Avatar dropdown in the nav rail with Settings and Log out actions.
// Closes on outside click or Escape.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { UserAvatar } from "./UserAvatar";

type ProfileMenuProps = {
  displayName: string;
  email: string;
  pictureUrl: string | null;
  onOpenSettings: () => void;
  onLogout: () => void;
  logoutPending: boolean;
};

const MENU_WIDTH_PX = 192;
const MENU_GAP_PX = 8;
const VIEWPORT_PADDING_PX = 8;

type MenuPosition = {
  left: number;
  bottom: number;
};

export function ProfileMenu({
  displayName,
  pictureUrl,
  onOpenSettings,
  onLogout,
  logoutPending,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function updateMenuPosition() {
    const button = buttonRef.current;
    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - MENU_WIDTH_PX / 2;
    left = Math.max(
      VIEWPORT_PADDING_PX,
      Math.min(left, window.innerWidth - MENU_WIDTH_PX - VIEWPORT_PADDING_PX),
    );

    setMenuPosition({
      left,
      bottom: window.innerHeight - rect.top + MENU_GAP_PX,
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

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const menu =
    open && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              left: menuPosition.left,
              bottom: menuPosition.bottom,
              width: MENU_WIDTH_PX,
              zIndex: 100,
            }}
            className="overflow-hidden rounded-lg border border-stone-600/50 bg-stone-900 shadow-xl shadow-black/40"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenSettings();
              }}
              className="w-full border-b border-stone-800/80 px-3 py-2.5 text-left text-sm font-medium text-stone-200 transition hover:bg-stone-800"
            >
              Settings
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={logoutPending}
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full px-3 py-2.5 text-left text-sm font-medium text-stone-200 transition hover:bg-stone-800 disabled:opacity-60"
            >
              {logoutPending ? "Logging out…" : "Log out"}
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full ring-offset-2 ring-offset-stone-950 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-lime-400/40"
      >
        <UserAvatar displayName={displayName} pictureUrl={pictureUrl} size="sm" />
      </button>
      {menu}
    </>
  );
}
