// keel_web/src/modules/shop/components/tags/FinanceTransactionTagPill.tsx

import type { FinanceTransactionTag } from "../../api";
import { financeTransactionTagPillStyle } from "../../lib/transactionTagDisplay";

type FinanceTransactionTagPillProps = {
  tag: FinanceTransactionTag;
  compact?: boolean;
  className?: string;
};

export function FinanceTransactionTagPill({ tag, compact = false, className }: FinanceTransactionTagPillProps) {
  const style = financeTransactionTagPillStyle(tag.color_hex);

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
