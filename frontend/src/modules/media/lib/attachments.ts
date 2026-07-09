// keel_web/src/modules/media/lib/attachments.ts

// Entity labels and detail routes for media attachment rows.

import type { MediaAttachment } from "../api";

const ENTITY_TYPE_LABELS: Record<string, string> = {
  project: "Project",
  finance_transaction: "Transaction",
  finance_obligation: "Subscription",
  contact: "Contact",
  figure: "Figure",
  finance_vendor: "Vendor",
};

export function mediaAttachmentEntityLabel(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType;
}

export function mediaAttachmentEntityPath(
  entityType: string,
  entityId: number,
): string | null {
  switch (entityType) {
    case "project":
      return `/projects/${entityId}`;
    case "finance_transaction":
      return `/finance/transactions/${entityId}`;
    case "finance_obligation":
      return `/finance/subscriptions/${entityId}`;
    case "contact":
      return `/people/contacts/${entityId}`;
    case "figure":
      return `/people/figures/${entityId}`;
    case "finance_vendor":
      return `/finance/vendors/${entityId}`;
    default:
      return null;
  }
}

export function mediaAttachmentEntityLinkLabel(attachment: MediaAttachment): string {
  const typeLabel = mediaAttachmentEntityLabel(attachment.entity_type);
  if (attachment.display_name?.trim()) {
    return `${typeLabel} · ${attachment.display_name.trim()}`;
  }
  return `${typeLabel} #${attachment.entity_id}`;
}
