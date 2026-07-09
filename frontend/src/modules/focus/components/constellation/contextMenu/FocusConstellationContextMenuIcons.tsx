// src/modules/focus/components/constellation/contextMenu/FocusConstellationContextMenuIcons.tsx

import type { ReactNode } from "react";

import { FocusInstantTooltip } from "../../shared/FocusInstantTooltip";
import {
  ICON_BUTTON_CLASS,
  ICON_BUTTON_DANGER_CLASS,
  ICON_BUTTON_DISABLED_CLASS,
} from "./FocusConstellationContextMenuStyles";

const ACTION_ICON_CLASS = "h-5 w-5";

export function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M8 6L12 10L8 14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

export function AlignChildrenIcon() {
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
      <circle cx="10" cy="10" r="2.1" />
      <circle cx="10" cy="4.4" r="1.35" />
      <circle cx="14.8" cy="7.8" r="1.35" />
      <circle cx="13.1" cy="14.1" r="1.35" />
      <circle cx="6.9" cy="14.1" r="1.35" />
      <circle cx="5.2" cy="7.8" r="1.35" />
    </svg>
  );
}

export function LineageIcon() {
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
      <rect x="7.6" y="2.6" width="4.8" height="3.6" rx="0.9" />
      <rect x="2.4" y="13.8" width="4.8" height="3.6" rx="0.9" />
      <rect x="12.8" y="13.8" width="4.8" height="3.6" rx="0.9" />
      <path d="M10 6.2V9.4" />
      <path d="M4.8 13.8V11H15.2V13.8" />
      <path d="M10 9.4V11" />
    </svg>
  );
}

export function EyeIcon() {
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

export function UnlinkIcon() {
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
      <circle cx="5.8" cy="10" r="2.2" />
      <circle cx="14.2" cy="10" r="2.2" />
      <path d="M8.2 10H9.3" />
      <path d="M10.7 10H11.8" />
      <path d="M9.4 8.7L10.6 11.3" />
    </svg>
  );
}

export function ScopedConstellationIcon() {
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
      <circle cx="10" cy="10" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="5.2" cy="6.8" r="1.15" />
      <circle cx="14.8" cy="6.2" r="1.15" />
      <circle cx="15.2" cy="13.8" r="1.15" />
      <circle cx="5.6" cy="13.4" r="1.15" />
      <path d="M10 10L5.2 6.8M10 10L14.8 6.2M10 10L15.2 13.8M10 10L5.6 13.4" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className={ACTION_ICON_CLASS}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 4.8V15.2" />
      <path d="M4.8 10H15.2" />
    </svg>
  );
}

export function IconButton({
  label,
  onClick,
  disabled = false,
  danger = false,
  onMouseEnter,
  onMouseLeave,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children: ReactNode;
}) {
  return (
    <FocusInstantTooltip label={label} className="w-full min-w-0">
      <button
        type="button"
        role="menuitem"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
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
    </FocusInstantTooltip>
  );
}
