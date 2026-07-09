// keel_web/src/components/ListSearch.tsx

// Real-time list filter input shared across module list views.

type ListSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function ListSearch({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: ListSearchProps) {
  return (
    <div className={["relative max-w-xl", className].filter(Boolean).join(" ")}>
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
        aria-hidden
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="8.5" cy="8.5" r="5.25" />
          <path d="M12.5 12.5L16.5 16.5" strokeLinecap="round" />
        </svg>
      </span>

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-stone-800 bg-stone-950/55 py-2.5 pl-10 pr-10 text-sm text-stone-100 placeholder:text-stone-500 focus:border-stone-600 focus:outline-none"
        aria-label={placeholder}
      />

      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-stone-500 transition hover:text-stone-300"
          aria-label="Clear search"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
