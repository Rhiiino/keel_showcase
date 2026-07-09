// stack_sandbox/frontend_web/src/components/select/SearchableSelect.tsx

// Searchable dropdown for relational records (filter + optional link to detail).

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { ExternalLinkIcon } from "../links/ExternalLinkButton";

export type SearchableSelectOption<TId extends string | number> = {
  id: TId;
  label: string;
  render?: ReactNode;
};

type SearchableSelectProps<TId extends string | number> = {
  label?: string;
  options: SearchableSelectOption<TId>[];
  value: TId | null;
  onChange: (id: TId | null) => void;
  placeholder?: string;
  noneLabel?: string;
  allowNone?: boolean;
  disabled?: boolean;
  onNavigate?: (id: TId) => void;
  navigateAriaLabel?: string;
  renderTriggerValue?: (option: SearchableSelectOption<TId> | null) => ReactNode;
  className?: string;
};

export function SearchableSelect<TId extends string | number>({
  label,
  options,
  value,
  onChange,
  placeholder = "Search…",
  noneLabel = "None",
  allowNone = true,
  disabled = false,
  onNavigate,
  navigateAriaLabel = "Open record",
  renderTriggerValue,
  className = "",
}: SearchableSelectProps<TId>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return options;
    }
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.clearTimeout(timer);
    };
  }, [open]);

  const handleNavigate = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (value === null || !onNavigate) {
      return;
    }
    onNavigate(value);
  };

  return (
    <div ref={containerRef} className={["relative", className].join(" ")}>
      {label && (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
          {label}
        </p>
      )}
      <div className="flex max-w-md items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={[
            "flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ring-1 ring-stone-800 transition",
            "bg-stone-900/50 text-stone-200 hover:ring-stone-600",
            disabled ? "cursor-not-allowed opacity-50" : "",
          ].join(" ")}
        >
          {renderTriggerValue ? (
            renderTriggerValue(selected)
          ) : selected ? (
            <span className="truncate">{selected.label}</span>
          ) : (
            <span className="text-stone-500">{noneLabel}</span>
          )}
          <svg
            viewBox="0 0 24 24"
            className={[
              "ml-auto h-4 w-4 shrink-0 opacity-60 transition",
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

        {value !== null && onNavigate && (
          <button
            type="button"
            disabled={disabled}
            onClick={handleNavigate}
            aria-label={navigateAriaLabel}
            title={navigateAriaLabel}
            className={[
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sky-400 ring-1 ring-stone-800 transition",
              disabled
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-stone-900/80 hover:text-sky-300",
            ].join(" ")}
          >
            <ExternalLinkIcon />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-full min-w-[14rem] max-w-md overflow-hidden rounded-lg border border-stone-800 bg-stone-950 shadow-lg ring-1 ring-stone-800/80">
          <div className="border-b border-stone-800 p-2">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              aria-label={`Search ${label ?? "options"}`}
              className="w-full rounded-md bg-stone-900/60 px-2.5 py-1.5 text-sm text-stone-100 ring-1 ring-stone-800 placeholder:text-stone-500 focus:outline-none focus:ring-stone-600"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
          <ul
            role="listbox"
            className="max-h-64 overflow-y-auto py-1"
          >
            {allowNone && (
              <li role="option" aria-selected={value === null}>
                <button
                  type="button"
                  className="flex w-full px-3 py-2 text-left text-sm text-stone-400 hover:bg-stone-900/80"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  {noneLabel}
                </button>
              </li>
            )}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-stone-500">No matches</li>
            )}
            {filtered.map((option) => (
              <li
                key={String(option.id)}
                role="option"
                aria-selected={option.id === value}
              >
                <button
                  type="button"
                  className={[
                    "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition",
                    option.id === value
                      ? "bg-stone-900/80 text-stone-100"
                      : "text-stone-200 hover:bg-stone-900/80",
                  ].join(" ")}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  {option.render ?? (
                    <span className="truncate">{option.label}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
