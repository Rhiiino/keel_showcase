// keel_web/src/modules/coak/components/tags/CoakTagPill.tsx

import type { CoakTag } from "../../api";
import { coakTagPillStyle } from "../../lib/coakTagDisplay";

type CoakTagPillProps = {
  tag: CoakTag;
  compact?: boolean;
  className?: string;
};

export function CoakTagPill({ tag, compact = false, className }: CoakTagPillProps) {
  const style = coakTagPillStyle(tag.color_hex);

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full font-medium ring-1",
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-xs",
        className ?? "",
      ].join(" ")}
      style={style}
    >
      {tag.name}
    </span>
  );
}
