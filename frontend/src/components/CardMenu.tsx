// keel_web/src/components/CardMenu.tsx

// Top-right three-dot menu for cards (delete and future actions).

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MENU_WIDTH_PX = 144;
const MENU_GAP_PX = 4;
const VIEWPORT_PADDING_PX = 8;
export const CARD_MENU_ROOT_ATTR = "data-card-menu-root";

type MenuPosition = {
  top: number;
  left: number;
};

type CardMenuItem = {
  id: string;
  label: string;
  tone?: "default" | "danger";
  disabled?: boolean;
  /** Return `false` to keep the menu open after selection (e.g. two-step delete confirm). */
  onSelect: () => void | boolean;
};

type CardMenuProps = {
  ariaLabel: string;
  items: CardMenuItem[];
  disabled?: boolean;
  className?: string;
};

export function CardMenu({
  ariaLabel,
  items,
  disabled = false,
  className = "",
}: CardMenuProps) {
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
    let left = rect.right - MENU_WIDTH_PX;
    if (left < VIEWPORT_PADDING_PX) {
      left = rect.left;
    }
    left = Math.min(
      left,
      window.innerWidth - MENU_WIDTH_PX - VIEWPORT_PADDING_PX,
    );

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
            className="overflow-hidden rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80"
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={disabled || item.disabled}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const keepOpen = item.onSelect() === false;
                  if (!keepOpen) {
                    setOpen(false);
                  }
                }}
                className={[
                  "flex w-full px-3 py-2 text-left text-xs transition disabled:opacity-50",
                  item.tone === "danger"
                    ? "text-red-300 hover:bg-red-950/40"
                    : "text-stone-200 hover:bg-stone-900/80",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        className={["pointer-events-auto", className].join(" ")}
        onClick={(event) => event.stopPropagation()}
      >
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
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="currentColor"
            aria-hidden
          >
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
