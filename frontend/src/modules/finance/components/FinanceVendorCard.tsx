// stack_sandbox/frontend_web/src/modules/shop/components/FinanceVendorCard.tsx

// Vendor card on the vendors grid — navigates to detail.

import { Link } from "react-router-dom";

import type { FinanceVendor } from "../api";
import { CardMenu } from "../../../components/CardMenu";
import { VendorImageBox } from "./VendorImageBox";

type FinanceVendorCardProps = {
  vendor: FinanceVendor;
  onDelete?: (vendorId: number) => void;
  deleteDisabled?: boolean;
};

export function FinanceVendorCard({
  vendor,
  onDelete,
  deleteDisabled = false,
}: FinanceVendorCardProps) {
  const handleDelete = () => {
    if (!window.confirm(`Delete vendor "${vendor.name}"?`)) {
      return;
    }
    onDelete?.(vendor.id);
  };

  return (
    <div className="group relative flex flex-col items-center rounded-xl border border-stone-800 bg-stone-950/60 p-4 text-center transition hover:border-stone-600 hover:bg-stone-900/80">
      <Link
        to={`/finance/vendors/${vendor.id}`}
        className="flex w-full flex-col items-center"
      >
        <VendorImageBox
          vendorName={vendor.name}
          logo={vendor.logo}
          size="lg"
        />
        <p className="mt-4 text-sm font-medium text-stone-200 group-hover:text-sky-300">
          {vendor.name}
        </p>
      </Link>

      {onDelete && (
        <CardMenu
          ariaLabel="Vendor options"
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
