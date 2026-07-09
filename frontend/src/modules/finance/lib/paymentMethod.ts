// keel_web/src/modules/finance/lib/paymentMethod.ts

// Payment method kind labels and helpers.

export const PAYMENT_METHOD_KINDS = [
  "credit_card",
  "debit_card",
  "checking",
  "savings",
  "prepaid",
  "other",
] as const;

export type FinancePaymentMethodKind = (typeof PAYMENT_METHOD_KINDS)[number];

export const PAYMENT_METHOD_KIND_LABELS: Record<FinancePaymentMethodKind, string> = {
  credit_card: "Credit card",
  debit_card: "Debit card",
  checking: "Checking",
  savings: "Savings",
  prepaid: "Prepaid",
  other: "Other",
};

export function isFinancePaymentMethodKind(value: string): value is FinancePaymentMethodKind {
  return (PAYMENT_METHOD_KINDS as readonly string[]).includes(value);
}

export function paymentMethodDisplayLabel(
  label: string,
  institutionName: string | null,
  lastFour: string | null,
): string {
  const parts = [label.trim()];
  if (institutionName?.trim()) {
    parts.push(institutionName.trim());
  }
  if (lastFour?.trim()) {
    parts.push(`•••• ${lastFour.trim()}`);
  }
  return parts.filter(Boolean).join(" · ");
}
