// keel_web/src/modules/finance/components/FinanceSummaryHeader.tsx

import type { ReactNode } from "react";

import type { FinanceSummary } from "../api";
import { formatMonthlyBurn } from "../lib/obligation";

type FinanceSummaryHeaderProps = {
  summary: FinanceSummary | undefined;
  isLoading?: boolean;
  className?: string;
};

type SummaryStatProps = {
  label: string;
  value: ReactNode;
  valueClassName?: string;
};

function SummaryStat({ label, value, valueClassName }: SummaryStatProps) {
  return (
    <div className="min-w-[5.5rem] shrink-0 text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
      <p
        className={[
          "mt-1 text-2xl font-semibold tabular-nums tracking-tight",
          valueClassName ?? "text-stone-50",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryStatSkeleton() {
  return (
    <div className="flex min-w-[5.5rem] shrink-0 flex-col items-center space-y-1.5">
      <div className="h-2.5 w-16 animate-pulse rounded bg-stone-800/50" />
      <div className="h-7 w-10 animate-pulse rounded bg-stone-800/30" />
    </div>
  );
}

export function FinanceSummaryHeader({
  summary,
  isLoading,
  className = "",
}: FinanceSummaryHeaderProps) {
  const wrapperClassName = ["flex shrink-0 flex-wrap gap-x-8 gap-y-3", className]
    .filter(Boolean)
    .join(" ");

  if (isLoading) {
    return (
      <div className={wrapperClassName}>
        {[0, 1, 2].map((key) => (
          <SummaryStatSkeleton key={key} />
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className={wrapperClassName}>
      <SummaryStat label="Active" value={summary.active_obligation_count} />
      <SummaryStat
        label="Monthly burn"
        value={formatMonthlyBurn(summary.monthly_burn)}
        valueClassName="text-emerald-400"
      />
      <SummaryStat label="Renewals (30 days)" value={summary.renewals_next_30_days} />
    </div>
  );
}
