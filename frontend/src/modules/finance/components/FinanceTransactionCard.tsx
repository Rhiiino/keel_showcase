// keel_web/src/modules/shop/components/FinanceTransactionCard.tsx

// Card for one purchase in the list view — cover image and vendor icon.

import { Link } from "react-router-dom";

import { financeTransactionCoverUrl, type FinanceTransaction, type FinanceVendor } from "../api";
import { STATUS_LABELS, formatPrice, isFinanceTransactionStatus } from "../lib/transaction";
import { CardMenu } from "../../../components/CardMenu";
import { VendorImageBox } from "./VendorImageBox";

type FinanceTransactionCardProps = {
  item: FinanceTransaction;
  vendor?: FinanceVendor | null;
  onDelete?: (transactionId: number) => void;
  deleteDisabled?: boolean;
};

export function FinanceTransactionCard({
  item,
  vendor,
  onDelete,
  deleteDisabled = false,
}: FinanceTransactionCardProps) {
  const statusLabel = isFinanceTransactionStatus(item.status)
    ? STATUS_LABELS[item.status]
    : item.status;
  const price = formatPrice(item.price_amount, item.currency);
  const coverUrl = financeTransactionCoverUrl(item);

  const handleDelete = () => {
    const label = item.title.trim() || "this item";
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      return;
    }
    onDelete?.(item.id);
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-stone-800 bg-stone-950/60 transition hover:border-stone-600 hover:bg-stone-900/80">
      <Link to={`/finance/transactions/${item.id}`} className="flex h-full min-h-0 flex-1 flex-col">
        <div className="relative aspect-[4/3] w-full shrink-0 bg-stone-900/80">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-stone-600">
              No image
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-md bg-stone-950/80 px-2 py-0.5 text-xs text-stone-300 ring-1 ring-stone-800">
            {statusLabel}
          </span>
        </div>

        <div className="mt-auto flex min-h-[6.75rem] flex-col justify-end gap-2 p-3">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-stone-100 group-hover:text-sky-300">
            {item.title}
          </h3>

          <div className="flex min-h-8 items-center gap-2">
            {(vendor || item.vendor_name) ? (
              <>
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
                <span className="truncate text-xs text-stone-500">
                  {vendor?.name ?? item.vendor_name}
                </span>
              </>
            ) : null}
          </div>

          <p className="min-h-4 text-xs text-stone-400">{price ?? ""}</p>
        </div>
      </Link>

      {onDelete && (
        <CardMenu
          ariaLabel="Item options"
          disabled={deleteDisabled}
          className="absolute right-2 top-2 z-10"
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
  );
}
