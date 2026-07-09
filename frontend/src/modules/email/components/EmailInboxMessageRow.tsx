// keel_web/src/modules/email/components/EmailInboxMessageRow.tsx

import type { MouseEvent } from "react";

import type { EmailMessageSummary } from "../api";
import {
  emailMessageFromLabel,
  emailMessageIsUnread,
  formatEmailMessageReceivedAt,
} from "../lib/emailInboxDisplay";

export const EMAIL_INBOX_LIST_GRID_CLASS =
  "grid w-full grid-cols-[2rem_7rem_minmax(0,14rem)_minmax(0,1fr)]";

type EmailInboxMessageRowProps = {
  message: EmailMessageSummary;
  onOpen: (messageId: string) => void;
};

export function EmailInboxMessageRow({ message, onOpen }: EmailInboxMessageRowProps) {
  const from = emailMessageFromLabel(message.from_name, message.from_email);
  const unread = emailMessageIsUnread(message.label_ids);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    onOpen(message.id);
  };

  return (
    <div
      onClick={handleClick}
      className={[
        "grid w-full cursor-pointer border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        EMAIL_INBOX_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="flex items-center justify-center px-2 py-3.5">
        {unread ? (
          <span
            className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_10px_2px_rgba(56,189,248,0.55)]"
            aria-label="Unread"
          />
        ) : null}
      </div>

      <div className="px-3 py-3.5 align-middle">
        <p className="text-xs tabular-nums text-stone-400">
          {formatEmailMessageReceivedAt(message.received_at)}
        </p>
      </div>

      <div className="min-w-0 px-3 py-3.5 align-middle">
        <p
          className={[
            "truncate text-sm text-stone-100",
            unread ? "font-semibold" : "font-medium",
          ].join(" ")}
          title={from.primary}
        >
          {from.primary}
        </p>
        {from.secondary ? (
          <p className="truncate text-xs text-stone-500" title={from.secondary}>
            {from.secondary}
          </p>
        ) : null}
      </div>

      <div className="min-w-0 px-3 py-3.5 align-middle">
        <p
          className={[
            "truncate text-sm text-stone-100",
            unread ? "font-semibold" : "",
          ].join(" ")}
          title={message.subject ?? "(No subject)"}
        >
          {message.subject?.trim() || "(No subject)"}
        </p>
        {message.snippet ? (
          <p className="mt-0.5 truncate text-xs text-stone-500" title={message.snippet}>
            {message.snippet}
          </p>
        ) : null}
      </div>
    </div>
  );
}
