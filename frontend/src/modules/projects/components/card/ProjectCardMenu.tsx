// stack_sandbox/frontend_web/src/modules/projects/components/card/ProjectCardMenu.tsx

// Top-right actions menu for a Kanban project card.

import { useEffect, useRef, useState } from "react";

type ProjectCardMenuProps = {
  projectTitle: string;
  disabled?: boolean;
  onDelete: () => void;
  className?: string;
};

export function ProjectCardMenu({
  projectTitle,
  disabled = false,
  onDelete,
  className = "",
}: ProjectCardMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleDelete = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const label = projectTitle.trim() || "this project";
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      setOpen(false);
      return;
    }

    onDelete();
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={["pointer-events-auto relative", className].join(" ")}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        aria-label="Project options"
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

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[9rem] overflow-hidden rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80"
        >
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={handleDelete}
            className="flex w-full px-3 py-2 text-left text-xs text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
