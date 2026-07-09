// keel_web/src/modules/projects/components/workspace/panel/WorkspaceFileRowMenu.tsx

// Row actions menu for workspace side panel file, folder, and note rows.

import { useEffect, useRef, useState } from "react";

import { useConfirmDeleteAction } from "../../../../../hooks/useConfirmDeleteAction";

type WorkspaceFileRowMenuProps = {
  disabled?: boolean;
  ariaLabel?: string;
  onRename?: () => void;
  onDelete?: () => void;
  extraActions?: Array<{ label: string; onSelect: () => void }>;
};

function DeleteConfirmIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5 shrink-0"
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

export function WorkspaceFileRowMenu({
  disabled = false,
  ariaLabel = "File options",
  onRename,
  onDelete,
  extraActions,
}: WorkspaceFileRowMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { confirmPending, containerRef: deleteConfirmContainerRef, handleClick } =
    useConfirmDeleteAction(open ? "open" : "closed");

  const setContainerNode = (node: HTMLDivElement | null) => {
    (containerRef as { current: HTMLDivElement | null }).current = node;
    (deleteConfirmContainerRef as { current: HTMLDivElement | null }).current = node;
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={setContainerNode} className="relative shrink-0" data-no-row-drag>
      <button
        type="button"
        disabled={disabled}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        className={[
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-500 transition",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-stone-800 hover:text-stone-200",
        ].join(" ")}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="currentColor"
          aria-hidden
        >
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[8.5rem] overflow-hidden rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80"
        >
          {onRename ? (
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                onRename();
                setOpen(false);
              }}
              className="flex w-full px-3 py-2 text-left text-xs text-stone-200 transition hover:bg-stone-900/80 disabled:opacity-50"
            >
              Rename
            </button>
          ) : null}
          {extraActions?.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                action.onSelect();
                setOpen(false);
              }}
              className="flex w-full px-3 py-2 text-left text-xs text-stone-200 transition hover:bg-stone-900/80 disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
          {onDelete ? (
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              aria-label={confirmPending ? "Confirm delete" : "Delete"}
              onClick={(event) => {
                event.stopPropagation();
                handleClick(() => {
                  onDelete();
                  setOpen(false);
                });
              }}
              className={[
                "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition disabled:opacity-50",
                confirmPending
                  ? "bg-red-950/50 text-red-200 hover:bg-red-950/70"
                  : "text-red-300 hover:bg-red-950/40",
              ].join(" ")}
            >
              {confirmPending ? <DeleteConfirmIcon /> : null}
              {confirmPending ? "Confirm delete" : "Delete"}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
