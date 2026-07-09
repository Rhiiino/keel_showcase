// stack_sandbox/frontend_web/src/modules/projects/components/detail/ProjectDetailInlineStatus.tsx

// Draft status picker for the project detail display view (saved via header Save).

import { useEffect, useRef, useState } from "react";

import {
  PROJECT_STATUSES,
  projectStatusLabel,
  projectStatusPillClass,
  type ProjectStatus,
} from "../../lib/project";

type ProjectDetailInlineStatusProps = {
  statusDraft: ProjectStatus;
  onStatusDraftChange: (nextStatus: ProjectStatus) => void;
  disabled?: boolean;
};

export function ProjectDetailInlineStatus({
  statusDraft,
  onStatusDraftChange,
  disabled = false,
}: ProjectDetailInlineStatusProps) {
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

  const selectStatus = (status: ProjectStatus) => {
    onStatusDraftChange(status);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Project status: ${projectStatusLabel(statusDraft)}`}
        className={[
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition",
          projectStatusPillClass(statusDraft),
          disabled
            ? "cursor-not-allowed opacity-50"
            : "hover:brightness-110",
        ].join(" ")}
      >
        <span>{projectStatusLabel(statusDraft)}</span>
        <svg
          viewBox="0 0 24 24"
          className={[
            "h-3.5 w-3.5 shrink-0 opacity-70 transition",
            open ? "rotate-180" : "",
          ].join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Project statuses"
          className="absolute left-0 top-full z-30 mt-2 min-w-[10rem] overflow-hidden rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80"
        >
          {PROJECT_STATUSES.map((status) => {
            const selected = status === statusDraft;
            return (
              <li key={status} role="option" aria-selected={selected}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => selectStatus(status)}
                  className={[
                    "flex w-full items-center px-3 py-2 text-left text-sm transition disabled:opacity-50",
                    selected
                      ? "bg-stone-900/80 text-stone-100"
                      : "text-stone-200 hover:bg-stone-900/80",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1",
                      projectStatusPillClass(status),
                    ].join(" ")}
                  >
                    {projectStatusLabel(status)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
