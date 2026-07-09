// keel_web/src/modules/email/lib/emailMessageDisplay.ts

import type { EmailAddress, EmailMessageDetail } from "../api";

export function formatEmailAddressList(addresses: EmailAddress[]): string {
  if (addresses.length === 0) {
    return "—";
  }

  return addresses
    .map((address) => {
      const name = address.name?.trim() ?? "";
      const email = address.email?.trim() ?? "";
      if (name && email) {
        return `${name} <${email}>`;
      }
      return email || name || "—";
    })
    .join(", ");
}

export function emailMessageBodyText(message: EmailMessageDetail): string {
  const plain = message.body_plain?.trim();
  if (plain) {
    return plain;
  }

  const html = message.body_html?.trim();
  if (!html) {
    return message.snippet?.trim() || "No message body available.";
  }

  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function emailMessageLabelSummary(labelIds: string[]): string {
  if (labelIds.length === 0) {
    return "—";
  }

  const friendlyLabels = labelIds.map((label) => {
    if (label === "INBOX") return "Inbox";
    if (label === "SENT") return "Sent";
    if (label === "SPAM") return "Junk";
    if (label === "TRASH") return "Trash";
    if (label === "UNREAD") return "Unread";
    if (label === "IMPORTANT") return "Important";
    if (label === "STARRED") return "Starred";
    return label;
  });

  return friendlyLabels.join(", ");
}
