// keel_web/src/modules/media/components/browse/MediaViewToggle.tsx

// Segmented header control to switch between list and carousel media views.

import type { ReactElement } from "react";

import type { MediaViewMode } from "../../lib/mediaView";

type MediaViewToggleProps = {
  viewMode: MediaViewMode;
  onChange: (viewMode: MediaViewMode) => void;
};

function ListRowsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M4 6h16M4 10h10M4 14h16M4 18h10" />
    </svg>
  );
}

function CarouselIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3.5" y="8" width="4" height="8" rx="1" />
      <rect x="9" y="5" width="6" height="14" rx="1.2" />
      <rect x="16.5" y="8" width="4" height="8" rx="1" />
    </svg>
  );
}

const SEGMENTS: {
  id: MediaViewMode;
  label: string;
  Icon: () => ReactElement;
}[] = [
  { id: "list", label: "List view", Icon: ListRowsIcon },
  { id: "carousel", label: "Carousel view", Icon: CarouselIcon },
];

export function MediaViewToggle({ viewMode, onChange }: MediaViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Media view"
      className="inline-flex h-9 items-center rounded-lg p-0.5 ring-1 ring-stone-700"
    >
      {SEGMENTS.map((segment) => {
        const active = viewMode === segment.id;
        const { Icon } = segment;
        return (
          <button
            key={segment.id}
            type="button"
            onClick={() => onChange(segment.id)}
            aria-pressed={active}
            aria-label={segment.label}
            title={segment.label}
            className={[
              "inline-flex h-8 w-8 items-center justify-center rounded-md transition",
              active
                ? "bg-stone-900/50 text-stone-200"
                : "text-stone-400 hover:text-stone-200",
            ].join(" ")}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
