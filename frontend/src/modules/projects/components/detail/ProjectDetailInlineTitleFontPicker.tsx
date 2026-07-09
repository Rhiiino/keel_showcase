// stack_sandbox/frontend_web/src/modules/projects/components/detail/ProjectDetailInlineTitleFontPicker.tsx

// Subtle title font picker for the project detail display view (saved via header Save).

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  PROJECT_TITLE_FONT_OPTIONS,
  projectTitleFontLabel,
  projectTitleFontStyle,
  type ProjectTitleFontKey,
} from "../../lib/project/appearance";

type ProjectDetailInlineTitleFontPickerProps = {
  titleFontDraft: ProjectTitleFontKey;
  onTitleFontDraftChange: (nextFont: ProjectTitleFontKey) => void;
  disabled?: boolean;
  className?: string;
  /** When true, the picker stays visible instead of appearing on hover only. */
  alwaysVisible?: boolean;
  /** Where the font list opens relative to the trigger. */
  menuAlign?: "left" | "right";
  /** Pixel dimensions for the trigger button and "Aa" label. */
  triggerDimensions?: {
    fontSizePx: number;
    buttonSizePx: number;
  };
};

const MENU_WIDTH_PX = 192;
const MENU_MAX_HEIGHT_PX = 288;
const MENU_GAP_PX = 8;
const VIEWPORT_PADDING_PX = 8;

type MenuPosition = {
  top: number;
  left: number;
  maxHeight: number;
};

export function ProjectDetailInlineTitleFontPicker({
  titleFontDraft,
  onTitleFontDraftChange,
  disabled = false,
  className = "",
  alwaysVisible = false,
  menuAlign = "right",
  triggerDimensions,
}: ProjectDetailInlineTitleFontPickerProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const updateMenuPosition = () => {
    const button = buttonRef.current;
    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP_PX - VIEWPORT_PADDING_PX;
    const spaceAbove = rect.top - MENU_GAP_PX - VIEWPORT_PADDING_PX;
    const openBelow = spaceBelow >= Math.min(MENU_MAX_HEIGHT_PX, spaceAbove);

    let top: number;
    let maxHeight: number;

    if (openBelow) {
      top = rect.bottom + MENU_GAP_PX;
      maxHeight = Math.min(MENU_MAX_HEIGHT_PX, spaceBelow);
    } else {
      maxHeight = Math.min(MENU_MAX_HEIGHT_PX, spaceAbove);
      top = rect.top - MENU_GAP_PX - maxHeight;
    }

    let left =
      menuAlign === "left"
        ? rect.left
        : rect.right - MENU_WIDTH_PX;
    left = Math.max(
      VIEWPORT_PADDING_PX,
      Math.min(left, window.innerWidth - MENU_WIDTH_PX - VIEWPORT_PADDING_PX),
    );

    setMenuPosition({ top, left, maxHeight });
  };

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
  }, [open, menuAlign]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selectFont = (fontKey: ProjectTitleFontKey) => {
    onTitleFontDraftChange(fontKey);
    setOpen(false);
  };

  const menu =
    open && menuPosition
      ? createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            aria-label="Title fonts"
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              width: MENU_WIDTH_PX,
              maxHeight: menuPosition.maxHeight,
              zIndex: 100,
            }}
            className="scrollbar-subtle overflow-y-auto rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80"
          >
            {PROJECT_TITLE_FONT_OPTIONS.map((option) => {
              const selected = option.key === titleFontDraft;
              return (
                <li key={option.key} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => selectFont(option.key)}
                    className={[
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition disabled:opacity-50",
                      selected
                        ? "bg-stone-900/80 text-stone-100"
                        : "text-stone-200 hover:bg-stone-900/80",
                    ].join(" ")}
                    style={{ fontFamily: option.family }}
                  >
                    <span>{option.label}</span>
                    {selected && (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4 shrink-0 text-sky-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div
      ref={containerRef}
      data-open={open}
      className={[
        "relative inline-flex transition-opacity duration-150",
        alwaysVisible
          ? "opacity-100 pointer-events-auto"
          : [
              "opacity-0 pointer-events-none",
              "group-hover/title:opacity-100 group-hover/title:pointer-events-auto",
              "group-focus-within/title:opacity-100 group-focus-within/title:pointer-events-auto",
              "data-[open=true]:opacity-100 data-[open=true]:pointer-events-auto",
            ].join(" "),
        className,
      ].join(" ")}
    >
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Title font: ${projectTitleFontLabel(titleFontDraft)}`}
        title={`Title font: ${projectTitleFontLabel(titleFontDraft)}`}
        className={[
          "inline-flex items-center justify-center rounded-md text-sm text-stone-500 ring-1 ring-transparent transition",
          triggerDimensions ? "" : "h-8 w-8",
          disabled
            ? "cursor-not-allowed opacity-40"
            : "hover:bg-stone-900/50 hover:text-stone-300 hover:ring-stone-800/80",
          open ? "bg-stone-900/50 text-stone-300 ring-stone-800/80" : "",
        ].join(" ")}
        style={{
          ...projectTitleFontStyle(titleFontDraft),
          ...(triggerDimensions
            ? {
                width: triggerDimensions.buttonSizePx,
                height: triggerDimensions.buttonSizePx,
              }
            : {}),
        }}
      >
        <span
          aria-hidden
          className={triggerDimensions ? "leading-none" : "text-base leading-none"}
          style={
            triggerDimensions
              ? { fontSize: triggerDimensions.fontSizePx }
              : undefined
          }
        >
          Aa
        </span>
      </button>

      {menu}
    </div>
  );
}
