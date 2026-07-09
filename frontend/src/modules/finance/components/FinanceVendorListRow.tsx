// keel_web/src/modules/finance/components/FinanceVendorListRow.tsx

// One vendor row in the list table view.

import { useNavigate } from "react-router-dom";

import type { FinanceVendor } from "../api";
import { CardMenu } from "../../../components/CardMenu";
import { VendorImageBox } from "./VendorImageBox";

export const FINANCE_VENDOR_LIST_TABLE_WIDTH_CLASS = "w-full min-w-[48rem]";

export const FINANCE_VENDOR_LIST_GRID_CLASS =
  "grid w-full grid-cols-[4rem_minmax(0,1.25fr)_minmax(0,1fr)_5rem_7rem_3rem] items-center";

type FinanceVendorListRowProps = {
  vendor: FinanceVendor;
  onDelete?: (vendorId: number) => void;
  deleteDisabled?: boolean;
};

function formatWebsiteDisplay(url: string | null): string | null {
  if (!url?.trim()) {
    return null;
  }
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.trim();
  }
}

function formatUpdatedDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

export function FinanceVendorListRow({
  vendor,
  onDelete,
  deleteDisabled = false,
}: FinanceVendorListRowProps) {
  const navigate = useNavigate();
  const itemPath = `/finance/vendors/${vendor.id}`;
  const websiteDisplay = formatWebsiteDisplay(vendor.website_url);

  const handleDelete = () => {
    if (!window.confirm(`Delete vendor "${vendor.name}"?`)) {
      return;
    }
    onDelete?.(vendor.id);
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
        FINANCE_VENDOR_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="px-4 py-3">
        <VendorImageBox vendorName={vendor.name} logo={vendor.logo} size="sm" />
      </div>

      <div className="min-w-0 px-4 py-3">
        <span className="block truncate font-medium text-stone-100">{vendor.name}</span>
      </div>

      <div className="min-w-0 px-4 py-3 text-sm text-stone-400">
        {websiteDisplay ? (
          <span className="block truncate" title={vendor.website_url ?? undefined}>
            {websiteDisplay}
          </span>
        ) : (
          <span className="text-stone-600">—</span>
        )}
      </div>

      <div className="whitespace-nowrap px-4 py-3 text-sm text-stone-400">
        {vendor.default_currency ?? "—"}
      </div>

      <div className="whitespace-nowrap px-4 py-3 text-sm text-stone-400">
        {formatUpdatedDate(vendor.updated_at)}
      </div>

      <div
        className="px-4 py-3"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {onDelete ? (
          <CardMenu
            ariaLabel={`Vendor options for ${vendor.name}`}
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
        ) : null}
      </div>
    </div>
  );
}
