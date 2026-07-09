// keel_web/src/modules/journal/components/tags/JournalTagPill.tsx

import type { JournalTag } from "../../api";
import { journalTagPillStyle } from "../../lib/journalTagDisplay";

type JournalTagPillProps = {
  tag: JournalTag;
  compact?: boolean;
  className?: string;
};

export function JournalTagPill({
  tag,
  compact = false,
  className,
}: JournalTagPillProps) {
  const style = journalTagPillStyle(tag.color_hex);

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
