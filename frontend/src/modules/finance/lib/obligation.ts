// keel_web/src/modules/finance/lib/obligation.ts

// Subscription obligation status, kind, and billing helpers.

export const OBLIGATION_STATUSES = ["active", "trial", "paused", "cancelled"] as const;
export type FinanceObligationStatus = (typeof OBLIGATION_STATUSES)[number];

export const OBLIGATION_KINDS = ["subscription", "membership", "bill"] as const;
export type FinanceObligationKind = (typeof OBLIGATION_KINDS)[number];

export const BILLING_INTERVALS = ["monthly", "annual", "weekly", "quarterly"] as const;
export type FinanceBillingInterval = (typeof BILLING_INTERVALS)[number];

export const OBLIGATION_STATUS_LABELS: Record<FinanceObligationStatus, string> = {
  active: "Active",
  trial: "Trial",
  paused: "Paused",
  cancelled: "Cancelled",
};

export const OBLIGATION_KIND_LABELS: Record<FinanceObligationKind, string> = {
  subscription: "Subscription",
  membership: "Membership",
  bill: "Bill",
};

export const BILLING_INTERVAL_LABELS: Record<FinanceBillingInterval, string> = {
  monthly: "Monthly",
  annual: "Annual",
  weekly: "Weekly",
  quarterly: "Quarterly",
};

export function isFinanceObligationStatus(value: string): value is FinanceObligationStatus {
  return (OBLIGATION_STATUSES as readonly string[]).includes(value);
}

export function obligationStatusPillClass(status: FinanceObligationStatus): string {
  switch (status) {
    case "active":
      return "bg-emerald-950/60 text-emerald-200 ring-emerald-800/80";
    case "trial":
      return "bg-sky-950/60 text-sky-200 ring-sky-800/80";
    case "paused":
      return "bg-amber-950/60 text-amber-200 ring-amber-800/80";
    case "cancelled":
      return "bg-stone-900/80 text-stone-400 ring-stone-700/80";
    default:
      return "bg-stone-900/80 text-stone-300 ring-stone-700/80";
  }
}

export function formatBillingSummary(
  amount: string | null | undefined,
  currency: string,
  interval: string,
): string | null {
  if (!amount) {
    return null;
  }
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) {
    return null;
  }
  try {
    const formatted = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format(numeric);
    const intervalLabel =
      BILLING_INTERVAL_LABELS[interval as FinanceBillingInterval] ?? interval;
    return `${formatted} / ${intervalLabel.toLowerCase()}`;
  } catch {
    return `${amount} ${currency} / ${interval}`;
  }
}

export function formatMonthlyBurn(amount: string | number): string {
  const numeric = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(numeric)) {
    return String(amount);
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(numeric);
  } catch {
    return String(numeric);
  }
}
