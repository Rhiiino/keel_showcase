// keel_web/src/modules/email/lib/emailDisplay.ts

import type {
  EmailAccount,
  EmailAccountCreatePayload,
  EmailAccountStatus,
  EmailAccountUpdatePayload,
  EmailProvider,
} from "../api";

export type EmailAccountFormValues = {
  provider: EmailProvider;
  email_address: string;
  nickname: string;
};

export const EMAIL_PROVIDER_OPTIONS: Array<{ value: EmailProvider; label: string }> = [
  { value: "gmail", label: "Gmail" },
];

export function emptyEmailAccountFormValues(): EmailAccountFormValues {
  return {
    provider: "gmail",
    email_address: "",
    nickname: "",
  };
}

export function emailAccountToFormValues(account: EmailAccount): EmailAccountFormValues {
  return {
    provider: account.provider,
    email_address: account.email_address,
    nickname: account.nickname,
  };
}

export function isEmailAccountFormValid(values: EmailAccountFormValues): boolean {
  return values.email_address.trim().length > 0;
}

export function formValuesToCreatePayload(
  values: EmailAccountFormValues,
): EmailAccountCreatePayload {
  return {
    provider: values.provider,
    email_address: values.email_address.trim(),
    nickname: values.nickname.trim(),
  };
}

export function formValuesToUpdatePayload(
  values: EmailAccountFormValues,
): EmailAccountUpdatePayload {
  return {
    provider: values.provider,
    email_address: values.email_address.trim(),
    nickname: values.nickname.trim(),
  };
}

export function emailAccountDisplayName(account: Pick<EmailAccount, "nickname" | "email_address">): string {
  const nickname = account.nickname.trim();
  return nickname.length > 0 ? nickname : account.email_address;
}

export function emailAccountNeedsConnect(status: EmailAccountStatus): boolean {
  return status !== "connected";
}

export function emailAccountConnectLabel(status: EmailAccountStatus): string {
  return status === "disconnected" ? "Connect" : "Reconnect";
}

export function emailAccountStatusLabel(status: EmailAccountStatus): string {
  if (status === "connected") {
    return "Connected";
  }
  if (status === "needs_reauth") {
    return "Needs re-auth";
  }
  return "Disconnected";
}

export function emailAccountStatusDotClass(status: EmailAccountStatus): string {
  if (status === "connected") {
    return "bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.55)]";
  }
  if (status === "needs_reauth") {
    return "bg-amber-400 shadow-[0_0_10px_2px_rgba(251,191,36,0.55)]";
  }
  return "bg-red-400 shadow-[0_0_10px_2px_rgba(248,113,113,0.55)]";
}

export function emailProviderLabel(provider: EmailProvider): string {
  return EMAIL_PROVIDER_OPTIONS.find((option) => option.value === provider)?.label ?? provider;
}

export function emailConnectErrorMessage(code: string | null): string | null {
  if (!code) {
    return null;
  }
  if (code === "access_denied") {
    return "Gmail connection was cancelled.";
  }
  if (code === "email_mismatch") {
    return "The Google account you signed into does not match this email address.";
  }
  if (code === "missing_gmail_scope") {
    return "Google did not grant mailbox read access. Enable the Gmail API in Google Cloud Console, add the Gmail read scope to your OAuth consent screen, then reconnect.";
  }
  return "Gmail connection failed. Try again.";
}

export function formatEmailAccountTimestamp(value: string | null): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function emailAccountConnectionHeading(
  account: Pick<EmailAccount, "status">,
): string {
  return account.status === "disconnected" ? "Disconnected at" : "Connected at";
}

export function emailAccountConnectionLabel(
  account: Pick<EmailAccount, "status" | "connected_at" | "disconnected_at">,
): string {
  if (account.status === "disconnected") {
    return formatEmailAccountTimestamp(account.disconnected_at);
  }
  return formatEmailAccountTimestamp(account.connected_at);
}
