// keel_web/src/modules/contacts/components/filters/ContactFilterFields.tsx

import type { ContactTag } from "../../api";
import { contactTagPillStyle } from "../../lib/contactTagDisplay";

type ContactFilterFieldsProps = {
  tags: ContactTag[];
  tagIds: number[];
  query: string;
  onTagIdsChange: (tagIds: number[]) => void;
  onQueryChange: (query: string) => void;
  disabled?: boolean;
};

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{children}</p>
  );
}

export function ContactFilterFields({
  tags,
  tagIds,
  query,
  onTagIdsChange,
  onQueryChange,
  disabled = false,
}: ContactFilterFieldsProps) {
  const toggleTag = (tagId: number) => {
    const nextTagIds = tagIds.includes(tagId)
      ? tagIds.filter((id) => id !== tagId)
      : [...tagIds, tagId];
    onTagIdsChange(nextTagIds);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-2">
        <SectionLabel>Tags</SectionLabel>
        {tags.length === 0 ? (
          <p className="text-sm text-stone-500">No tags yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const selected = tagIds.includes(tag.id);
              const style = contactTagPillStyle(tag.color_hex);
              return (
                <button
                  key={tag.id}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => toggleTag(tag.id)}
                  className={[
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition",
                    selected ? "ring-2 ring-sky-400/70" : "opacity-70 hover:opacity-100",
                    disabled ? "cursor-not-allowed opacity-50" : "",
                  ].join(" ")}
                  style={style}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <SectionLabel>Name</SectionLabel>
        <input
          type="search"
          value={query}
          disabled={disabled}
          placeholder="Search name…"
          aria-label="Search contact name"
          onChange={(event) => onQueryChange(event.target.value)}
          className="w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 placeholder:text-stone-500 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
        />
      </div>
    </div>
  );
}
