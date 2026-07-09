// keel_web/src/modules/finance/components/FinanceAccountListRow.tsx

// One payment method row in the accounts list table view.

import { useNavigate } from "react-router-dom";

import { useConfirmDeleteAction } from "../../../hooks/useConfirmDeleteAction";
import type { FinancePaymentMethod } from "../api";
import {
  PAYMENT_METHOD_KIND_LABELS,
  isFinancePaymentMethodKind,
} from "../lib/paymentMethod";
import { CardMenu } from "../../../components/CardMenu";

export const FINANCE_ACCOUNT_LIST_TABLE_WIDTH_CLASS = "w-full min-w-[40rem]";

export const FINANCE_ACCOUNT_LIST_GRID_CLASS =
  "grid w-full grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_7rem_5rem_3rem] items-center";

type FinanceAccountListRowProps = {
  account: FinancePaymentMethod;
  onDelete?: (paymentMethodId: number) => void;
  deleteDisabled?: boolean;
};

function formatInstitutionDetails(
  institutionName: string | null,
  lastFour: string | null,
): string | null {
  const parts: string[] = [];
  if (institutionName?.trim()) {
    parts.push(institutionName.trim());
  }
  if (lastFour?.trim()) {
    parts.push(`•••• ${lastFour.trim()}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function FinanceAccountListRow({
  account,
  onDelete,
  deleteDisabled = false,
}: FinanceAccountListRowProps) {
  const navigate = useNavigate();
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(account.id);

  const itemPath = `/finance/accounts/${account.id}`;
  const kindLabel = isFinancePaymentMethodKind(account.kind)
    ? PAYMENT_METHOD_KIND_LABELS[account.kind]
    : account.kind;
  const institutionDetails = formatInstitutionDetails(
    account.institution_name,
    account.last_four,
  );

  const openItem = () => {
    navigate(itemPath);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openItem}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openItem();
        }
      }}
      className={[
        "cursor-pointer border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        FINANCE_ACCOUNT_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="min-w-0 px-4 py-3">
        <span className="block truncate font-medium text-stone-100">{account.label}</span>
      </div>

      <div className="min-w-0 px-4 py-3 text-sm text-stone-400">
        {institutionDetails ?? <span className="text-stone-600">—</span>}
      </div>

      <div className="whitespace-nowrap px-4 py-3 text-sm text-stone-400">{kindLabel}</div>

      <div className="whitespace-nowrap px-4 py-3 text-sm text-stone-400">
        {account.is_active ? "Yes" : "No"}
      </div>

      <div
        className="relative z-20 px-4 py-3"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <div ref={containerRef} className="flex items-center justify-end">
          {onDelete ? (
            <CardMenu
              ariaLabel={`Account options for ${account.label}`}
              disabled={deleteDisabled}
              items={[
                {
                  id: "delete",
                  label: confirmPending ? "Confirm delete" : "Delete",
                  tone: "danger",
                  onSelect: () => {
                    handleClick(() => onDelete(account.id));
                  },
                },
              ]}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
