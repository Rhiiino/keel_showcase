// keel_web/src/modules/coak/components/tabs/constellation/graph/CoakGraphNodeContextMenuIcons.tsx

import type { ReactNode } from "react";

export const MENU_ITEM_CLASS =
  "flex w-full items-center px-3 py-2 text-left text-xs leading-none text-stone-200 transition hover:bg-stone-900/80 disabled:cursor-not-allowed disabled:opacity-50";

export const MENU_ICON_SLOT_CLASS =
  "flex h-3.5 w-3.5 shrink-0 items-center justify-center text-stone-400";

export function CoakGraphMenuItemContent({
  icon,
  label,
  trailing,
}: {
  icon: ReactNode;
  label: string;
  trailing?: ReactNode;
}) {
  return (
    <>
      <span className={MENU_ICON_SLOT_CLASS}>{icon}</span>
      <span className="min-w-0 flex-1">{label}</span>
      {trailing}
    </>
  );
}

export function CoakGraphMenuOptimizeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden>
      <circle cx="12" cy="5" r="1.75" strokeWidth="1.75" />
      <circle cx="6" cy="17" r="1.75" strokeWidth="1.75" />
      <circle cx="18" cy="17" r="1.75" strokeWidth="1.75" />
      <path d="M12 6.75v3.5M10.2 10.4 7.4 15.2M13.8 10.4l2.8 4.8" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function CoakGraphMenuRotateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M20 12a8 8 0 1 1-2.34-5.66"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 4v4h-4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CoakGraphMenuRevolveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="2.25" strokeWidth="1.75" />
      <path
        d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M6.4 6.4l1.4 1.4M16.2 16.2l1.4 1.4M17.6 6.4l-1.4 1.4M7.8 16.2l-1.4 1.4"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CoakGraphMenuRevealIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" strokeWidth="1.75" />
    </svg>
  );
}
export function CoakGraphMenuMinimizeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M6 9h12M6 15h12"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M9 6 12 3l3 3M9 18l3 3 3-3"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CoakGraphMenuMoveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M12 3v18M3 12h18"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="m8 7 4-4 4 4M8 17l4 4 4-4M7 8 3 12l4 4M17 8l4 4-4 4"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CoakGraphMenuSwapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M7 7h11M7 7l3-3M7 7l3 3M17 17H6M17 17l-3 3M17 17l-3-3"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CoakGraphMenuTrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function CoakGraphMenuFileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function nestedSubmenuPositionClass(flipLeft: boolean): string {
  return flipLeft ? "absolute top-0 right-full pr-0.5" : "absolute top-0 left-full pl-0.5";
}
