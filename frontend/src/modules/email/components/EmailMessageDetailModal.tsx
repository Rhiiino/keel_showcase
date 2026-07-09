// keel_web/src/modules/email/components/EmailMessageDetailModal.tsx

import { useEffect } from "react";
import { createPortal } from "react-dom";

import type { EmailMessageDetail, EmailMessageSummary } from "../api";
import {
  emailMessageFromLabel,
  formatEmailMessageReceivedAt,
} from "../lib/emailInboxDisplay";
import {
  emailMessageBodyText,
  emailMessageLabelSummary,
  formatEmailAddressList,
} from "../lib/emailMessageDisplay";

type EmailMessageDetailModalProps = {
  summary: EmailMessageSummary | null;
  detail: EmailMessageDetail | null;
  isLoading: boolean;
  errorMessage: string | null;
  onClose: () => void;
};

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className="text-sm text-stone-200">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

export function EmailMessageDetailModal({
  summary,
  detail,
  isLoading,
  errorMessage,
  onClose,
}: EmailMessageDetailModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!summary) {
    return null;
  }

  const message = detail ?? summary;
  const from = emailMessageFromLabel(message.from_name, message.from_email);
  const bodyText = detail ? emailMessageBodyText(detail) : summary.snippet;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-message-detail-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-stone-800 bg-stone-950 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="email-message-detail-title"
              className="truncate text-lg font-medium text-stone-100"
            >
              {message.subject?.trim() || "(No subject)"}
            </h2>
            <p className="mt-0.5 text-sm text-stone-500">
              {formatEmailMessageReceivedAt(message.received_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-stone-700 px-2.5 py-1.5 text-xs text-stone-300 hover:bg-stone-900"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {isLoading ? <p className="text-sm text-stone-500">Loading message…</p> : null}
          {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}

          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField
              label="From"
              value={
                from.secondary ? `${from.primary} <${from.secondary}>` : from.primary
              }
            />
            <DetailField label="To" value={formatEmailAddressList(message.to)} />
            {detail ? (
              <DetailField label="Cc" value={formatEmailAddressList(detail.cc)} />
            ) : null}
            <DetailField label="Labels" value={emailMessageLabelSummary(message.label_ids)} />
            {message.has_attachments ? (
              <DetailField
                label="Attachments"
                value={
                  detail?.attachment_names?.length
                    ? detail.attachment_names.join(", ")
                    : "Has attachments"
                }
              />
            ) : null}
          </dl>

          {summary.snippet ? (
            <div className="mt-6 grid gap-1.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Snippet
              </dt>
              <dd className="text-sm text-stone-400">{summary.snippet}</dd>
            </div>
          ) : null}

          <div className="mt-6 grid gap-1.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Body</dt>
            <dd>
              <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-lg border border-stone-800 bg-stone-950 p-4 text-sm text-stone-200">
                {bodyText}
              </pre>
            </dd>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
