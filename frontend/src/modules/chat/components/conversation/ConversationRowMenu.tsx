// stack_sandbox/frontend_web/src/modules/chat/components/conversation/ConversationRowMenu.tsx

// Three-dot menu for conversation row actions (rename, delete).

import { useEffect, useRef, useState } from "react";

type ConversationRowMenuItem = {
  id: string;
  label: string;
  tone?: "default" | "danger";
  onSelect: () => void;
};

type ConversationRowMenuProps = {
  items: ConversationRowMenuItem[];
  disabled?: boolean;
};

export function ConversationRowMenu({
  items,
  disabled = false,
}: ConversationRowMenuProps) {
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

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto absolute right-1 top-1 z-10"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen((current) => !current);
          }}
          aria-label="Conversation options"
          aria-haspopup="menu"
          aria-expanded={open}
          className={[
            "inline-flex h-6 w-6 items-center justify-center rounded-md text-stone-500 transition",
            disabled
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-stone-800/80 hover:text-stone-300",
          ].join(" ")}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="currentColor"
            aria-hidden
          >
            <circle cx="6" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="18" cy="12" r="1.5" />
          </svg>
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-30 mt-1 min-w-[9rem] overflow-hidden rounded-lg border border-stone-800 bg-stone-950 py-1 shadow-lg ring-1 ring-stone-800/80"
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={disabled}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  item.onSelect();
                  setOpen(false);
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
