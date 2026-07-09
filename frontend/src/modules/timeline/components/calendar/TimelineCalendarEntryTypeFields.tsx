// keel_web/src/modules/timeline/components/calendar/TimelineCalendarEntryTypeFields.tsx

import type { TimelineCalendarEntryType } from "../../lib/timelineCalendarFilters";

const ENTRY_TYPE_OPTIONS: {
  id: TimelineCalendarEntryType;
  label: string;
  style: {
    backgroundColor: string;
    color: string;
    borderColor: string;
    textShadow: string;
  };
}[] = [
  {
    id: "events",
    label: "Events",
    style: {
      backgroundColor: "rgb(37 99 235 / 0.85)",
      color: "rgb(250 250 249)",
      borderColor: "rgb(29 78 216)",
      textShadow: "0 1px 2px rgba(0, 0, 0, 0.35)",
    },
  },
  {
    id: "plans",
    label: "Plans",
    style: {
      backgroundColor: "rgb(14 116 144 / 0.55)",
      color: "rgb(250 250 249)",
      borderColor: "rgb(34 211 238 / 0.55)",
      textShadow: "0 1px 2px rgba(0, 0, 0, 0.35)",
    },
  },
];

type TimelineCalendarEntryTypeFieldsProps = {
  entryTypes: TimelineCalendarEntryType[];
  onEntryTypesChange: (entryTypes: TimelineCalendarEntryType[]) => void;
  disabled?: boolean;
};

export function TimelineCalendarEntryTypeFields({
  entryTypes,
  onEntryTypesChange,
  disabled = false,
}: TimelineCalendarEntryTypeFieldsProps) {
  const toggleEntryType = (entryType: TimelineCalendarEntryType) => {
    const nextEntryTypes = entryTypes.includes(entryType)
      ? entryTypes.filter((type) => type !== entryType)
      : [...entryTypes, entryType];
    onEntryTypesChange(nextEntryTypes);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Type</p>
      <div className="flex flex-wrap gap-2">
        {ENTRY_TYPE_OPTIONS.map((option) => {
          const selected = entryTypes.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => toggleEntryType(option.id)}
              className={[
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition",
                option.id === "plans" ? "border border-dashed" : "",
                selected ? "ring-2 ring-sky-400/70" : "opacity-70 hover:opacity-100",
                disabled ? "cursor-not-allowed opacity-50" : "",
              ].join(" ")}
              style={option.style}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
