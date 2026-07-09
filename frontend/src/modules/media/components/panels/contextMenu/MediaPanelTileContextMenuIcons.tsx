// keel_web/src/modules/media/components/panels/contextMenu/MediaPanelTileContextMenuIcons.tsx

import type { ReactNode } from "react";

import {
  ICON_BUTTON_CLASS,
  ICON_BUTTON_DANGER_CLASS,
  ICON_BUTTON_DISABLED_CLASS,
} from "./MediaPanelTileContextMenuStyles";

const ACTION_ICON_CLASS = "h-5 w-5";

function MediaInstantTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="group/media-panel-tooltip relative inline-flex w-full min-w-0">
      {children}
      <span
        role="tooltip"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[calc(100%+0.35rem)] left-1/2 z-[110] -translate-x-1/2 whitespace-nowrap rounded-md border border-white/[0.10] bg-stone-950/95 px-2 py-1 text-[11px] font-medium text-white/92 opacity-0 shadow-[0_4px_16px_rgba(0,0,0,0.35)] group-hover/media-panel-tooltip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

export function TrashIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className={ACTION_ICON_CLASS}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 6H16" />
      <path d="M8 6V4.6C8 4.1 8.4 3.6 9 3.6H11C11.6 3.6 12 4.1 12 4.6V6" />
      <path d="M5.7 6L6.2 15.4C6.2 15.9 6.6 16.4 7.2 16.4H12.8C13.4 16.4 13.8 15.9 13.8 15.4L14.3 6" />
      <path d="M8.5 9V13.4" />
      <path d="M11.5 9V13.4" />
    </svg>
  );
}

function QuestionMarkIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8.2 7.4C8.5 6.2 9.4 5.4 10.6 5.4C12 5.4 13.1 6.5 13.1 7.9C13.1 9.1 12.4 9.8 11.2 10.6C10.5 11.1 10 11.8 10 12.7" />
      <circle cx="10" cy="15.2" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DeleteActionIcon({ confirmPending }: { confirmPending: boolean }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <TrashIcon />
      {confirmPending ? <QuestionMarkIcon /> : null}
    </span>
  );
}

export function DetailsIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className={ACTION_ICON_CLASS}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M5 6.5H15" />
      <path d="M5 10H15" />
      <path d="M5 13.5H15" />
    </svg>
  );
}

export function ViewIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className={ACTION_ICON_CLASS}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2.8 10C4.4 6.2 7.2 4 10 4C12.8 4 15.6 6.2 17.2 10C15.6 13.8 12.8 16 10 16C7.2 16 4.4 13.8 2.8 10Z" />
      <circle cx="10" cy="10" r="2.4" />
    </svg>
  );
}

export function SwapIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className={ACTION_ICON_CLASS}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6.5 7.5L4 10L6.5 12.5" />
      <path d="M4 10H13.5C14.9 10 16 11.1 16 12.5V13" />
      <path d="M13.5 12.5L16 10L13.5 7.5" />
      <path d="M16 10H6.5C5.1 10 4 8.9 4 7.5V7" />
    </svg>
  );
}

export function IconButton({
  label,
  onClick,
  disabled = false,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <MediaInstantTooltip label={label}>
      <button
        type="button"
        role="menuitem"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className={
          disabled
            ? ICON_BUTTON_DISABLED_CLASS
            : danger
              ? ICON_BUTTON_DANGER_CLASS
              : ICON_BUTTON_CLASS
        }
      >
        {children}
      </button>
    </MediaInstantTooltip>
  );
}
