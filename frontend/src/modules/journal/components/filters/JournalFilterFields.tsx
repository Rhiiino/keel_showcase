// keel_web/src/modules/journal/components/filters/JournalFilterFields.tsx

import type { JournalTag } from "../../api";
import { journalTagPillStyle } from "../../lib/journalTagDisplay";

type JournalFilterFieldsProps = {
  tags: JournalTag[];
  tagIds: number[];
  onTagIdsChange: (tagIds: number[]) => void;
  query: string;
  onQueryChange: (query: string) => void;
  entryDateFrom: string;
  entryDateTo: string;
  onEntryDateFromChange: (value: string) => void;
  onEntryDateToChange: (value: string) => void;
  disabled?: boolean;
};

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{children}</p>
  );
}

export function JournalFilterFields({
  tags,
  tagIds,
  onTagIdsChange,
  query,
  onQueryChange,
  entryDateFrom,
  entryDateTo,
  onEntryDateFromChange,
  onEntryDateToChange,
  disabled = false,
}: JournalFilterFieldsProps) {
  const toggleTag = (tagId: number) => {
    const nextTagIds = tagIds.includes(tagId)
      ? tagIds.filter((id) => id !== tagId)
      : [...tagIds, tagId];
    onTagIdsChange(nextTagIds);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3">
        <SectionLabel>Tags</SectionLabel>
        {tags.length === 0 ? (
          <p className="text-sm text-stone-500">No tags yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const selected = tagIds.includes(tag.id);
              const style = journalTagPillStyle(tag.color_hex);
              return (
                <button
                  key={tag.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleTag(tag.id)}
                  className={[
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition",
                    selected ? "ring-sky-400/60" : "opacity-70 hover:opacity-100",
                    disabled ? "cursor-not-allowed opacity-50" : "",
                  ].join(" ")}
                  style={style}
                  aria-pressed={selected}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <SectionLabel>Search</SectionLabel>
        <input
          type="search"
          value={query}
          disabled={disabled}
          placeholder="Search entry content…"
          onChange={(event) => onQueryChange(event.target.value)}
          className="w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 placeholder:text-stone-500 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
        />
      </div>

      <div className="space-y-3">
        <SectionLabel>Date range</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-stone-500">From</label>
            <input
              type="date"
              value={entryDateFrom}
              disabled={disabled}
              onChange={(event) => onEntryDateFromChange(event.target.value)}
              className="w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">To</label>
            <input
              type="date"
              value={entryDateTo}
              disabled={disabled}
              onChange={(event) => onEntryDateToChange(event.target.value)}
              className="w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
