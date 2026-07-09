// keel_web/src/modules/shop/components/tags/FinanceObligationTagPill.tsx

import type { FinanceObligationTag } from "../../api";
import { financeObligationTagPillStyle } from "../../lib/obligationTagDisplay";

type FinanceObligationTagPillProps = {
  tag: FinanceObligationTag;
  compact?: boolean;
  className?: string;
};

export function FinanceObligationTagPill({ tag, compact = false, className }: FinanceObligationTagPillProps) {
  const style = financeObligationTagPillStyle(tag.color_hex);

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
