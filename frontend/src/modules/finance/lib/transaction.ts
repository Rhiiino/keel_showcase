// keel_web/src/modules/finance/lib/transaction.ts

// Transaction status, kind labels, and helpers.

export const TRANSACTION_STATUSES = [
  "considering",
  "ordered",
  "in_transit",
  "received",
  "cancelled",
  "returned",
] as const;

export type FinanceTransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const TRANSACTION_KINDS = [
  "physical",
  "expense",
  "subscription",
  "service",
] as const;

export type FinanceTransactionKind = (typeof TRANSACTION_KINDS)[number];

export const KIND_LABELS: Record<FinanceTransactionKind, string> = {
  physical: "Physical",
  expense: "Expense",
  subscription: "Subscription",
  service: "Service",
};

export const STATUS_LABELS: Record<FinanceTransactionStatus, string> = {
  considering: "Considering",
  ordered: "Ordered",
  in_transit: "In transit",
  received: "Received",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const STATUS_ORDER: FinanceTransactionStatus[] = [
  "considering",
  "ordered",
  "in_transit",
  "received",
  "cancelled",
  "returned",
];

export function isFinanceTransactionStatus(value: string): value is FinanceTransactionStatus {
  return (TRANSACTION_STATUSES as readonly string[]).includes(value);
}

export function isFinanceTransactionKind(value: string): value is FinanceTransactionKind {
  return (TRANSACTION_KINDS as readonly string[]).includes(value);
}

export function financeTransactionKindLabel(kind: FinanceTransactionKind): string {
  return KIND_LABELS[kind];
}

export function financeTransactionKindPillClass(kind: FinanceTransactionKind): string {
  switch (kind) {
    case "physical":
      return "bg-sky-950/60 text-sky-200 ring-sky-800/80";
    case "expense":
      return "bg-amber-950/60 text-amber-200 ring-amber-800/80";
    case "subscription":
      return "bg-violet-950/60 text-violet-200 ring-violet-800/80";
    case "service":
      return "bg-emerald-950/60 text-emerald-200 ring-emerald-800/80";
    default:
      return "bg-stone-900/80 text-stone-300 ring-stone-700/80";
  }
}

export function financeTransactionStatusLabel(status: FinanceTransactionStatus): string {
  return STATUS_LABELS[status];
}

export function financeTransactionStatusPillClass(status: FinanceTransactionStatus): string {
  switch (status) {
    case "considering":
      return "bg-amber-950/60 text-amber-200 ring-amber-800/80";
    case "ordered":
      return "bg-sky-950/60 text-sky-200 ring-sky-800/80";
    case "in_transit":
      return "bg-violet-950/60 text-violet-200 ring-violet-800/80";
    case "received":
      return "bg-emerald-950/60 text-emerald-200 ring-emerald-800/80";
    case "cancelled":
      return "bg-stone-900/80 text-stone-400 ring-stone-700/80";
    case "returned":
      return "bg-orange-950/60 text-orange-200 ring-orange-800/80";
    default:
      return "bg-stone-900/80 text-stone-300 ring-stone-700/80";
  }
}

export function financeTransactionDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
}

export function financeTransactionDateInputToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return `${trimmed}T00:00:00`;
}

export function formatFinanceTransactionDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) {
    return datePart;
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(year, month - 1, day));
  } catch {
    return datePart;
  }
}

export function formatPrice(
  amount: string | number | null | undefined,
  currency: string,
): string | null {
  if (amount === null || amount === undefined || amount === "") {
    return null;
  }
  const numeric = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(numeric)) {
    return null;
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format(numeric);
  } catch {
    return `${numeric} ${currency}`;
  }
}
