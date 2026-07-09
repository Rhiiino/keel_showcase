// keel_web/src/modules/email/components/EmailAccountsListRow.tsx

import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

import { CardMenu } from "../../../components/CardMenu";
import { useConfirmDeleteAction } from "../../../hooks/useConfirmDeleteAction";
import type { EmailAccount } from "../api";
import { emailAccountPath } from "../api";
import {
  emailAccountConnectionHeading,
  emailAccountConnectionLabel,
  emailAccountDisplayName,
} from "../lib/emailDisplay";
import { EmailAccountStatusDot } from "./EmailAccountStatusDot";

export const EMAIL_ACCOUNTS_LIST_TABLE_WIDTH_CLASS = "w-full min-w-[40rem]";

export const EMAIL_ACCOUNTS_LIST_GRID_CLASS =
  "grid w-full grid-cols-[4rem_minmax(0,18rem)_13rem_1fr_2.75rem]";

type EmailAccountsListRowProps = {
  account: EmailAccount;
  onDelete?: (accountId: number) => void;
  deleteDisabled?: boolean;
};

export function EmailAccountsListRow({
  account,
  onDelete,
  deleteDisabled = false,
}: EmailAccountsListRowProps) {
  const navigate = useNavigate();
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(account.id);
  const displayName = emailAccountDisplayName(account);
  const connectionHeading = emailAccountConnectionHeading(account);
  const connectionLabel = emailAccountConnectionLabel(account);
  const isDisconnected = account.status === "disconnected";

  const handleRowClick = (clickEvent: MouseEvent<HTMLDivElement>) => {
    if ((clickEvent.target as HTMLElement).closest("[data-no-row-nav]")) {
      return;
    }
    navigate(emailAccountPath(account));
  };

  const menuItems = [
    {
      id: "delete",
      label: confirmPending ? "Confirm delete" : "Delete",
      tone: "danger" as const,
      disabled: deleteDisabled || !onDelete,
      onSelect: () => {
        handleClick(() => onDelete?.(account.id));
      },
    },
  ];

  return (
    <div
      onClick={handleRowClick}
      className={[
        "grid w-full cursor-pointer border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        EMAIL_ACCOUNTS_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="flex items-center justify-center px-4 py-3.5 align-middle">
        <EmailAccountStatusDot status={account.status} />
      </div>

      <div className="min-w-0 px-4 py-3.5 align-middle">
        <p className="truncate text-sm font-medium text-stone-100" title={displayName}>
          {displayName}
        </p>
        {account.nickname.trim().length > 0 ? (
          <p className="truncate text-xs text-stone-500" title={account.email_address}>
            {account.email_address}
          </p>
        ) : null}
      </div>

      <div className="px-4 py-3.5 text-left align-middle">
        <p className="text-xs text-stone-500">{connectionHeading}</p>
        <p
          className={[
            "text-sm",
            isDisconnected ? "text-stone-500" : "text-stone-300",
          ].join(" ")}
        >
          {connectionLabel}
        </p>
      </div>

      <div aria-hidden />

      <div
        ref={containerRef}
        data-no-row-nav
        className="relative z-10 flex shrink-0 items-center justify-center px-1 py-3.5"
      >
        <CardMenu
          ariaLabel={`Options for ${displayName}`}
          disabled={deleteDisabled}
          items={menuItems}
        />
      </div>
    </div>
  );
}
