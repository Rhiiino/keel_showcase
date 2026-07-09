// keel_web/src/modules/projects/components/cover/CoverImageFrame.tsx

// Overflow wrapper that applies persisted cover image zoom and focal point.

import type { CSSProperties, ReactNode } from "react";

import { coverImageFrameStyle } from "../../lib/project/appearance";
import { PROJECT_COVER_IMAGE_FRAME_CLASS } from "./coverImageDisplay";

type CoverImageFrameProps = {
  scale?: number | null;
  positionX?: number | null;
  positionY?: number | null;
  className?: string;
  imageClassName?: string;
  children: ReactNode;
};

export function CoverImageFrame({
  scale,
  positionX,
  positionY,
  className,
  imageClassName,
  children,
}: CoverImageFrameProps) {
  const frameStyle = coverImageFrameStyle(scale ?? 1, positionX ?? 50, positionY ?? 50);

  return (
    <div
      className={[
        "h-full w-full overflow-hidden",
        PROJECT_COVER_IMAGE_FRAME_CLASS,
        className ?? "",
      ].join(" ")}
    >
      <div
        className={["h-full w-full", imageClassName ?? ""].join(" ")}
        style={frameStyle as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
