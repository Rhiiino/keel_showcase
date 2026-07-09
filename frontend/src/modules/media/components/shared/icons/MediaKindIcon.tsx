// keel_web/src/modules/media/components/shared/icons/MediaKindIcon.tsx

// Fallback icon when a media file has no inline preview.

import { mediaKindLabel } from "../../../lib/media";

type MediaKindIconProps = {
  mediaKind: string;
  className?: string;
};

export function MediaKindIcon({ mediaKind, className = "h-6 w-6" }: MediaKindIconProps) {
  const label = mediaKindLabel(mediaKind);

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-1 text-stone-500"
      title={label}
    >
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
      </svg>
      <span className="max-w-full truncate px-1 text-[10px] font-medium uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}
