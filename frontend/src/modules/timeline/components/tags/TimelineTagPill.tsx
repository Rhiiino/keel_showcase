// keel_web/src/modules/timeline/components/tags/TimelineTagPill.tsx

import type { TimelineTag } from "../../api";
import { timelineTagPillStyle } from "../../lib/timelineTagDisplay";

type TimelineTagPillProps = {
  tag: TimelineTag;
  compact?: boolean;
  className?: string;
};

export function TimelineTagPill({
  tag,
  compact = false,
  className,
}: TimelineTagPillProps) {
  const style = timelineTagPillStyle(tag.color_hex);

  return (
    <span
      className={[
        "inline-flex items-center rounded-full font-medium ring-1",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className ?? "",
      ].join(" ")}
      style={style}
    >
      {tag.name}
    </span>
  );
}
