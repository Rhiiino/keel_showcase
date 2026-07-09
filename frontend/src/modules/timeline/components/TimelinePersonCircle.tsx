// keel_web/src/modules/timeline/components/TimelinePersonCircle.tsx

// Circular profile photo or name fallback for timeline people.

import { buildMediaContentUrl, type MediaObject } from "../../media/api";
import {
  TIMELINE_PERSON_CIRCLE_SIZE_CLASS,
  timelinePersonCircleLabel,
} from "../lib/timelinePersonCircle";

type TimelinePersonCircleProps = {
  displayName: string;
  photo?: MediaObject | null;
  firstName?: string | null;
  sizeClass?: string;
  showTooltip?: boolean;
};

export function TimelinePersonCircle({
  displayName,
  photo = null,
  firstName = null,
  sizeClass = TIMELINE_PERSON_CIRCLE_SIZE_CLASS,
  showTooltip = true,
}: TimelinePersonCircleProps) {
  const photoUrl = photo ? buildMediaContentUrl(photo.id, photo.updated_at) : null;
  const label = timelinePersonCircleLabel(displayName, firstName);

  const labelTextClass = sizeClass.includes("h-24")
    ? "text-sm"
    : sizeClass.includes("h-4")
      ? "text-[8px]"
      : sizeClass.includes("h-6")
        ? "text-[9px]"
        : "text-[10px]";

  return (
    <span
      className={`group/person relative inline-flex shrink-0 cursor-default ${sizeClass}`}
      aria-label={displayName}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          className={`${sizeClass} rounded-full object-cover ring-1 ring-stone-700`}
        />
      ) : (
        <span
          className={`${sizeClass} flex items-center justify-center overflow-hidden rounded-full bg-stone-800 px-0.5 text-center ${labelTextClass} font-medium leading-none text-stone-200 ring-1 ring-stone-700`}
          aria-hidden
        >
          {label}
        </span>
      )}
      {showTooltip ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-950/95 px-2 py-1 text-xs font-medium text-stone-100 opacity-0 shadow-md ring-1 ring-stone-700 group-hover/person:opacity-100"
        >
          {displayName}
        </span>
      ) : null}
    </span>
  );
}
