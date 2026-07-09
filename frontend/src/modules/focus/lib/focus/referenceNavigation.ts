// keel_web/src/modules/focus/lib/focus/referenceNavigation.ts

const REFERENCE_TYPE_LABELS: Record<string, string> = {
  project: "Project",
  finance_transaction: "Transaction",
  contact: "Contact",
  figure: "Figure",
  agent: "Agent",
  media_object: "Media object",
  tool: "Tool",
  tool_category: "Tool category",
};

export function focusReferenceTypeLabel(targetType: string): string {
  return REFERENCE_TYPE_LABELS[targetType] ?? targetType.replace(/_/g, " ");
}

export function resolveFocusReferenceWebPath(
  targetType: string,
  targetId: string | number,
): string | null {
  const normalizedId = String(targetId).trim();
  if (!normalizedId) {
    return null;
  }

  switch (targetType) {
    case "project":
      return `/projects/${normalizedId}`;
    case "finance_transaction":
      return `/finance/transactions/${normalizedId}`;
    case "contact":
      return `/people/contacts/${normalizedId}`;
    case "figure":
      return `/people/figures/${normalizedId}`;
    case "agent":
      return `/agents?agent=${normalizedId}`;
    case "media_object":
      return `/media/${normalizedId}`;
    default:
      return null;
  }
}

export function isFocusRecordReference(
  targetType: string | null | undefined,
  targetId: string | number | null | undefined,
): targetType is string {
  return (
    typeof targetType === "string" &&
    targetType.length > 0 &&
    (typeof targetId === "string" || typeof targetId === "number") &&
    String(targetId).trim().length > 0
  );
}
