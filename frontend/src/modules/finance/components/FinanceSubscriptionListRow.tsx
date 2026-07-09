// keel_web/src/modules/finance/components/FinanceSubscriptionListRow.tsx

// One subscription row in the list table view.

import { useNavigate } from "react-router-dom";

import { useConfirmDeleteAction } from "../../../hooks/useConfirmDeleteAction";
import type { FinanceObligation, FinanceVendor } from "../api";
import {
  OBLIGATION_STATUS_LABELS,
  formatBillingSummary,
  isFinanceObligationStatus,
  obligationStatusPillClass,
} from "../lib/obligation";
import { CardMenu } from "../../../components/CardMenu";
import { FinanceObligationTagPill } from "./tags/FinanceObligationTagPill";
import { VendorImageBox } from "./VendorImageBox";

export const FINANCE_SUBSCRIPTION_LIST_TABLE_WIDTH_CLASS = "w-full min-w-[64rem]";

export const FINANCE_SUBSCRIPTION_LIST_GRID_CLASS =
  "grid w-full grid-cols-[minmax(0,1.25fr)_4rem_9.5rem_8.5rem_minmax(0,1fr)_minmax(0,1fr)_6.5rem_3rem] items-center gap-x-4";

type FinanceSubscriptionListRowProps = {
  obligation: FinanceObligation;
  vendor?: FinanceVendor | null;
  onDelete?: (obligationId: number) => void;
  deleteDisabled?: boolean;
};

export function FinanceSubscriptionListRow({
  obligation,
  vendor,
  onDelete,
  deleteDisabled = false,
}: FinanceSubscriptionListRowProps) {
  const navigate = useNavigate();
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(obligation.id);

  const itemPath = `/finance/subscriptions/${obligation.id}`;
  const statusLabel = isFinanceObligationStatus(obligation.status)
    ? OBLIGATION_STATUS_LABELS[obligation.status]
    : obligation.status;
  const billing = formatBillingSummary(
    obligation.amount,
    obligation.currency,
    obligation.billing_interval,
  );
  const vendorName = vendor?.name ?? obligation.vendor_name;

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
        FINANCE_SUBSCRIPTION_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="min-w-0 px-4 py-3">
        <span className="block truncate font-medium text-stone-100">{obligation.name}</span>
      </div>

      <div className="px-4 py-3">
        {vendorName ? (
          <div className="flex items-center">
            <VendorImageBox
              vendorName={vendorName}
              logo={vendor?.logo ?? null}
              size="sm"
              initialLength={1}
            />
          </div>
        ) : (
          <span className="text-stone-600">—</span>
        )}
      </div>

      <div className="whitespace-nowrap px-4 py-3 text-sm text-stone-300">{billing ?? "—"}</div>

      <div className="whitespace-nowrap px-4 py-3 text-sm text-stone-400">
        {obligation.next_billing_at
          ? new Date(obligation.next_billing_at).toLocaleDateString()
          : "—"}
      </div>

      <div className="min-w-0 truncate px-4 py-3 text-sm text-stone-400">
        {obligation.payment_method_label ?? "—"}
      </div>

      <div className="px-4 py-3">
        {obligation.tags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {obligation.tags.map((tag) => (
              <FinanceObligationTagPill key={tag.id} tag={tag} compact />
            ))}
          </div>
        ) : (
          <span className="text-stone-600">—</span>
        )}
      </div>

      <div className="whitespace-nowrap px-4 py-3">
        <span
          className={[
            "inline-flex rounded-full px-2 py-0.5 text-xs ring-1",
            isFinanceObligationStatus(obligation.status)
              ? obligationStatusPillClass(obligation.status)
              : "bg-stone-900/80 text-stone-300 ring-stone-700/80",
          ].join(" ")}
        >
          {statusLabel}
        </span>
      </div>

      <div
        className="relative z-20 px-4 py-3"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <div ref={containerRef} className="flex items-center justify-end">
          {onDelete ? (
            <CardMenu
              ariaLabel={`Subscription options for ${obligation.name}`}
              disabled={deleteDisabled}
              items={[
                {
                  id: "delete",
                  label: confirmPending ? "Confirm delete" : "Delete",
                  tone: "danger",
                  onSelect: () => {
                    handleClick(() => onDelete(obligation.id));
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
