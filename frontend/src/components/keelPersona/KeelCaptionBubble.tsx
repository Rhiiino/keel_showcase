// keel_web/src/components/keelPersona/KeelCaptionBubble.tsx

import type { KeelCaption } from "../../lib/keelPersona";

type KeelCaptionBubbleProps = {
  caption: KeelCaption | null;
  textOverride?: string | null;
  /** When set, overrides `caption.loadingDots`. */
  loadingDots?: boolean;
  className?: string;
};

function CaptionLoadingDots() {
  return (
    <span className="inline-flex items-end gap-1 pl-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="keel-caption-loading-dot inline-block rounded-full bg-stone-100"
          style={{ animationDelay: `${index * 0.2}s` }}
        />
      ))}
    </span>
  );
}

export function KeelCaptionBubble({
  caption,
  textOverride,
  loadingDots,
  className = "",
}: KeelCaptionBubbleProps) {
  const text = textOverride ?? caption?.text;
  if (!text) {
    return null;
  }

  const showLoadingDots = loadingDots ?? caption?.loadingDots ?? false;

  return (
    <div
      className={`max-w-xs rounded-xl border border-stone-700/80 bg-stone-950/90 px-3 py-2 text-center shadow-lg ${className}`}
    >
      <p className="inline-flex flex-wrap items-end justify-center text-sm font-medium leading-snug text-stone-100">
        <span>{text}</span>
        {showLoadingDots ? <CaptionLoadingDots /> : null}
      </p>
    </div>
  );
}
