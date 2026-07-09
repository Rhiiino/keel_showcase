// keel_web/src/modules/timeline/components/filters/TimelineEventFilterFields.tsx

import type { Contact } from "../../../people/contacts/api";
import type { Figure } from "../../../people/figures/api";
import type { TimelineTag } from "../../api";
import { timelineTagPillStyle } from "../../lib/timelineTagDisplay";
import { ContactMultiSelect } from "../ContactMultiSelect";
import { FigureMultiSelect } from "../FigureMultiSelect";

type TimelineEventFilterFieldsProps = {
  tags: TimelineTag[];
  contacts: Contact[];
  figures: Figure[];
  tagIds: number[];
  contactIds: number[];
  figureIds: number[];
  onTagIdsChange: (tagIds: number[]) => void;
  onContactIdsChange: (contactIds: number[]) => void;
  onFigureIdsChange: (figureIds: number[]) => void;
  query?: string;
  onQueryChange?: (query: string) => void;
  disabled?: boolean;
};

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{children}</p>
  );
}

export function TimelineEventFilterFields({
  tags,
  contacts,
  figures,
  tagIds,
  contactIds,
  figureIds,
  onTagIdsChange,
  onContactIdsChange,
  onFigureIdsChange,
  query,
  onQueryChange,
  disabled = false,
}: TimelineEventFilterFieldsProps) {
  const showQuery = onQueryChange != null;

  const toggleTag = (tagId: number) => {
    const nextTagIds = tagIds.includes(tagId)
      ? tagIds.filter((id) => id !== tagId)
      : [...tagIds, tagId];
    onTagIdsChange(nextTagIds);
  };

  return (
    <div
      className={[
        "grid gap-6",
        showQuery ? "lg:grid-cols-3" : "lg:grid-cols-2",
      ].join(" ")}
    >
      <div className="space-y-2">
        <SectionLabel>Tags</SectionLabel>
        {tags.length === 0 ? (
          <p className="text-sm text-stone-500">No tags yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const selected = tagIds.includes(tag.id);
              const style = timelineTagPillStyle(tag.color_hex);
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
        <ContactMultiSelect
          contacts={contacts}
          value={contactIds}
          onChange={onContactIdsChange}
          disabled={disabled}
          label="Contacts"
          variant="circles"
          size="compact"
          removable
        />
        <FigureMultiSelect
          figures={figures}
          value={figureIds}
          onChange={onFigureIdsChange}
          disabled={disabled}
          variant="circles"
          size="compact"
          removable
        />
      </div>

      {showQuery ? (
        <div className="space-y-2">
          <SectionLabel>Event</SectionLabel>
          <input
            type="search"
            value={query ?? ""}
            disabled={disabled}
            placeholder="Search event text…"
            aria-label="Search event text"
            onChange={(event) => onQueryChange(event.target.value)}
            className="w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 placeholder:text-stone-500 focus:outline-none focus:ring-stone-600 disabled:opacity-50"
          />
        </div>
      ) : null}
    </div>
  );
}
