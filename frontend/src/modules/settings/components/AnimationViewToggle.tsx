// keel_web/src/modules/settings/components/AnimationViewToggle.tsx

import type { ReactElement } from "react";

import type { AnimationViewMode } from "../lib/animationView";

type AnimationViewToggleProps = {
  viewMode: AnimationViewMode;
  onChange: (viewMode: AnimationViewMode) => void;
};

function CardGridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
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
  id: AnimationViewMode;
  label: string;
  Icon: () => ReactElement;
}[] = [
  { id: "cards", label: "Card view", Icon: CardGridIcon },
  { id: "carousel", label: "Carousel view", Icon: CarouselIcon },
];

export function AnimationViewToggle({ viewMode, onChange }: AnimationViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Animations view"
      className="inline-flex h-9 shrink-0 items-center rounded-lg p-0.5 ring-1 ring-stone-700"
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
