// keel_web/src/modules/finance/components/FinanceListRow.tsx

// One purchase row in the list table view.

import { useNavigate } from "react-router-dom";

import { financeTransactionCoverUrl, type FinanceTransaction, type FinanceVendor } from "../api";
import {
  formatFinanceTransactionDate,
  STATUS_LABELS,
  KIND_LABELS,
  formatPrice,
  isFinanceTransactionKind,
  isFinanceTransactionStatus,
  financeTransactionKindPillClass,
  financeTransactionStatusPillClass,
} from "../lib/transaction";
import { CardMenu } from "../../../components/CardMenu";
import { FinanceTransactionTagPill } from "./tags/FinanceTransactionTagPill";
import { VendorImageBox } from "./VendorImageBox";

export const FINANCE_TRANSACTION_LIST_TABLE_WIDTH_CLASS = "w-full min-w-[62rem]";

export const FINANCE_TRANSACTION_LIST_GRID_CLASS =
  "grid w-full grid-cols-[7.5rem_7rem_minmax(0,1.25fr)_6.5rem_8rem_minmax(0,1fr)_6rem_minmax(0,1fr)_3rem] items-center";

type FinanceListRowProps = {
  item: FinanceTransaction;
  vendor?: FinanceVendor | null;
  onDelete?: (transactionId: number) => void;
  deleteDisabled?: boolean;
};

export function FinanceListRow({
  item,
  vendor,
  onDelete,
  deleteDisabled = false,
}: FinanceListRowProps) {
  const navigate = useNavigate();
  const itemPath = `/finance/transactions/${item.id}`;
  const statusLabel = isFinanceTransactionStatus(item.status)
    ? STATUS_LABELS[item.status]
    : item.status;
  const statusPillClass = isFinanceTransactionStatus(item.status)
    ? financeTransactionStatusPillClass(item.status)
    : "bg-stone-900/80 text-stone-300 ring-stone-700/80";
  const price = formatPrice(item.price_amount, item.currency);
  const vendorName = vendor?.name ?? item.vendor_name;
  const coverUrl = financeTransactionCoverUrl(item);
  const orderedLabel = formatFinanceTransactionDate(item.ordered_at);
  const kindLabel = isFinanceTransactionKind(item.kind) ? KIND_LABELS[item.kind] : item.kind;
  const kindPillClass = isFinanceTransactionKind(item.kind)
    ? financeTransactionKindPillClass(item.kind)
    : "bg-stone-900/80 text-stone-300 ring-stone-700/80";

  const handleDelete = () => {
    const label = item.title.trim() || "this item";
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      return;
    }
    onDelete?.(item.id);
  };

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
        FINANCE_TRANSACTION_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="whitespace-nowrap px-4 py-4 text-xs text-stone-400">
        {orderedLabel}
      </div>

      <div className="px-4 py-4">
        <div className="block w-20 shrink-0 overflow-hidden rounded-lg bg-stone-900/80 ring-1 ring-stone-800">
          <div className="aspect-[4/3] w-full">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-stone-600">
                No image
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden px-4 py-4">
        <span
          title={item.title}
          className="block truncate text-sm font-medium text-stone-100"
        >
          {item.title}
        </span>
      </div>

      <div className="whitespace-nowrap px-4 py-4 text-xs text-stone-400">
        {price ?? "—"}
      </div>

      <div className="whitespace-nowrap px-4 py-4">
        <span
          className={[
            "inline-flex rounded-md px-2 py-0.5 text-xs ring-1",
            statusPillClass,
          ].join(" ")}
        >
          {statusLabel}
        </span>
      </div>

      <div className="min-w-0 overflow-hidden px-4 py-4">
        {vendorName ? (
          <div className="flex min-w-0 items-center gap-2">
            {vendor ? (
              <VendorImageBox
                vendorName={vendor.name}
                logo={vendor.logo}
                size="sm"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-stone-800 text-[10px] font-semibold uppercase text-stone-500 ring-1 ring-stone-700">
                {(item.vendor_name ?? "?").slice(0, 2)}
              </div>
            )}
            <span className="truncate text-xs text-stone-500">{vendorName}</span>
          </div>
        ) : (
          <span className="text-xs text-stone-600">—</span>
        )}
      </div>

      <div className="whitespace-nowrap px-4 py-4">
        <span
          className={[
            "inline-flex rounded-md px-2 py-0.5 text-xs ring-1",
            kindPillClass,
          ].join(" ")}
        >
          {kindLabel}
        </span>
      </div>

      <div className="px-4 py-4">
        {item.tags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {item.tags.map((tag) => (
              <FinanceTransactionTagPill key={tag.id} tag={tag} compact />
            ))}
          </div>
        ) : (
          <span className="text-xs text-stone-600">—</span>
        )}
      </div>

      <div
        className="px-4 py-4"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {onDelete && (
          <CardMenu
            ariaLabel="Item options"
            disabled={deleteDisabled}
            items={[
              {
                id: "delete",
                label: "Delete",
                tone: "danger",
                onSelect: handleDelete,
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
